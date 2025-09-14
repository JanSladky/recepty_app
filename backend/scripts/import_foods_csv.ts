import * as fs from "fs";
import * as path from "path";
import csv from "csv-parser";
import db from "../src/utils/db";

type Row = {
  name: string;
  energy_kcal_100g?: string;
  proteins_100g?: string;
  carbs_100g?: string;
  sugars_100g?: string;
  fat_100g?: string;
  saturated_fat_100g?: string;
  fiber_100g?: string;
  sodium_100g?: string;
  default_grams?: string;
  unit_name?: string;
  category_name?: string;
};

function toNum(v?: string | null): number | null {
  if (v == null) return null;
  const s = String(v).trim().replace(",", ".");
  if (s === "" || s.toLowerCase() === "null" || s.toLowerCase() === "nan") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

async function ensureCategory(client: any, name?: string | null): Promise<number | null> {
  if (!name || !name.trim()) return null;
  const clean = name.trim();
  const found = await client.query(
    "SELECT id FROM ingredient_categories WHERE lower(name)=lower($1) LIMIT 1",
    [clean]
  );
  if (found.rows.length) return found.rows[0].id as number;
  const ins = await client.query(
    "INSERT INTO ingredient_categories (name) VALUES ($1) RETURNING id",
    [clean]
  );
  return ins.rows[0].id as number;
}

async function upsertIngredient(row: Row, client: any) {
  const name = (row.name || "").trim();
  if (!name) return;

  const energy_kcal_100g = toNum(row.energy_kcal_100g);
  const proteins_100g    = toNum(row.proteins_100g);
  const carbs_100g       = toNum(row.carbs_100g);
  const sugars_100g      = toNum(row.sugars_100g);
  const fat_100g         = toNum(row.fat_100g);
  const sat_fat_100g     = toNum(row.saturated_fat_100g);
  const fiber_100g       = toNum(row.fiber_100g);
  const sodium_100g      = toNum(row.sodium_100g);
  const default_grams    = toNum(row.default_grams);
  const unit_name        = row.unit_name && row.unit_name.trim() ? row.unit_name.trim() : "g";
  const category_id      = await ensureCategory(client, row.category_name);

  const calories_per_gram = energy_kcal_100g != null ? energy_kcal_100g / 100 : null;

  // 1) UPDATE existující položky podle lower(name) – nic nepadá na unikátní index
  const upd = await client.query(
    `
    UPDATE ingredients
       SET category_id        = COALESCE($2, category_id),
           unit_name          = COALESCE($3, unit_name),
           default_grams      = COALESCE($4, default_grams),
           energy_kcal_100g   = COALESCE($5, energy_kcal_100g),
           proteins_100g      = COALESCE($6, proteins_100g),
           carbs_100g         = COALESCE($7, carbs_100g),
           sugars_100g        = COALESCE($8, sugars_100g),
           fat_100g           = COALESCE($9, fat_100g),
           saturated_fat_100g = COALESCE($10, saturated_fat_100g),
           fiber_100g         = COALESCE($11, fiber_100g),
           sodium_100g        = COALESCE($12, sodium_100g),
           calories_per_gram  = COALESCE($13, calories_per_gram)
     WHERE lower(name) = lower($1)
     RETURNING id
    `,
    [
      name,
      category_id,
      unit_name,
      default_grams,
      energy_kcal_100g,
      proteins_100g,
      carbs_100g,
      sugars_100g,
      fat_100g,
      sat_fat_100g,
      fiber_100g,
      sodium_100g,
      calories_per_gram
    ]
  );

  if (upd.rowCount && upd.rowCount > 0) return; // hotovo – aktualizováno

  // 2) INSERT nové položky
  await client.query(
    `
    INSERT INTO ingredients
      (name, category_id, unit_name, default_grams,
       energy_kcal_100g, proteins_100g, carbs_100g, sugars_100g,
       fat_100g, saturated_fat_100g, fiber_100g, sodium_100g,
       calories_per_gram)
    VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    `,
    [
      name,
      category_id,
      unit_name,
      default_grams,
      energy_kcal_100g,
      proteins_100g,
      carbs_100g,
      sugars_100g,
      fat_100g,
      sat_fat_100g,
      fiber_100g,
      sodium_100g,
      calories_per_gram
    ]
  );
}

async function run() {
  // Preferuj data/usda/custom_foods.csv; fallback na data/foods.csv
  const csvPathCandidates = [
    path.resolve(process.cwd(), "data", "usda", "custom_foods.csv"),
    path.resolve(process.cwd(), "data", "foods.csv"),
  ];
  const csvPath = csvPathCandidates.find(p => fs.existsSync(p));
  if (!csvPath) {
    console.error("❌ CSV nenalezeno. Očekávám data/usda/custom_foods.csv nebo data/foods.csv");
    process.exit(1);
  }

  const rows: Row[] = [];
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvPath)
      // @ts-ignore – csv-parser nemá zabalené TS typy
      .pipe(csv())
      .on("data", (r: Row) => rows.push(r))
      .on("end", resolve)
      .on("error", reject);
  });

  console.log(`📊 Načteno ${rows.length} řádků z CSV (${path.relative(process.cwd(), csvPath)})`);

  const client = await db.connect();
  // menší batch = menší šance na deadlocky v hosted DB
  const BATCH = 200;
  let done = 0;

  try {
    await client.query("BEGIN");
    for (const r of rows) {
      await upsertIngredient(r, client);
      done++;

      if (done % BATCH === 0) {
        await client.query("COMMIT");  // uvolní zámky
        await client.query("BEGIN");   // nová dávka
        console.log(`… zpracováno ${done}/${rows.length}`);
      }
    }
    await client.query("COMMIT");
    console.log(`✅ Import hotov. Zpracováno ${done} záznamů.`);
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("❌ Import selhal:", e);
    process.exit(1);
  } finally {
    client.release();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});