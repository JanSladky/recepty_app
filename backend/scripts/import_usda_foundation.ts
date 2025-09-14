/* eslint-disable @typescript-eslint/no-var-requires */
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import db from "../src/utils/db";

/**
 * Očekávané vstupy:
 *   backend/data/usda/food.csv
 *   backend/data/usda/food_nutrient.csv
 *   backend/data/usda/nutrient.csv
 *
 * Funguje s Foundation i SR-Legacy. Automaticky mapuje nutrienty podle názvu.
 */

type FoodRow = {
  fdc_id: string;           // číslo
  description: string;      // název
  data_type?: string;       // Foundation, SR Legacy, ...
};

type NutrientRow = {
  id: string;               // nutrient_id
  name: string;             // "Energy", "Protein", ...
  unit_name?: string;       // "kcal", "g"...
};

type FoodNutrientRow = {
  fdc_id: string;
  nutrient_id: string;
  amount: string; // číslo jako string
};

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data", "usda");
const FOOD_CSV = path.join(DATA_DIR, "food.csv");
const FOOD_NUTRIENT_CSV = path.join(DATA_DIR, "food_nutrient.csv");
const NUTRIENT_CSV = path.join(DATA_DIR, "nutrient.csv");

// hlavní makra, která chceme vytáhnout
const NUTRIENT_ALIASES: Record<
  keyof Required<Pick<UsdaMacros, "energy_kcal_100g"|"proteins_100g"|"carbs_100g"|"sugars_100g"|"fat_100g"|"saturated_fat_100g"|"fiber_100g"|"sodium_100g">>,
  string[]
> = {
  energy_kcal_100g: [
    "Energy", "Energy (Atwater General Factors)", "Energy (kcal)", "Energy, kcal"
  ],
  proteins_100g: [
    "Protein", "Protein (g)"
  ],
  carbs_100g: [
    "Carbohydrate, by difference", "Carbohydrate, by difference (g)", "Carbohydrates"
  ],
  sugars_100g: [
    "Sugars, total including NLEA", "Sugars, total", "Total sugars"
  ],
  fat_100g: [
    "Total lipid (fat)", "Fatty acids, total fat", "Fat"
  ],
  saturated_fat_100g: [
    "Fatty acids, total saturated", "Saturated fat", "Fatty acids, total saturated (g)"
  ],
  fiber_100g: [
    "Fiber, total dietary", "Dietary fiber"
  ],
  sodium_100g: [
    "Sodium, Na", "Sodium"
  ],
};

type UsdaMacros = {
  energy_kcal_100g?: number | null;
  proteins_100g?: number | null;
  carbs_100g?: number | null;
  sugars_100g?: number | null;
  fat_100g?: number | null;
  saturated_fat_100g?: number | null;
  fiber_100g?: number | null;
  sodium_100g?: number | null;
};

function mustFile(p: string) {
  if (!fs.existsSync(p)) {
    throw new Error(`Soubor neexistuje: ${p}`);
  }
}

async function loadCSV<T = any>(file: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const rows: T[] = [];
    fs.createReadStream(file)
      .pipe(csv())
      .on("data", (row) => rows.push(row as T))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

function norm(s: string | undefined | null) {
  return (s ?? "").trim();
}

function toNum(x: string | number | undefined | null): number | null {
  if (x === undefined || x === null) return null;
  const n = typeof x === "number" ? x : Number(String(x).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

async function main() {
  // připojení info
  const url = process.env.DATABASE_URL || "";
  const host = url.match(/@([^:/]+)(?=[:/])/i)?.[1] || "unknown";
  console.log(`🔌 PG via DATABASE_URL → host=${host} ssl=${url.includes("sslmode") || url.includes("ssl") ? "on":"?"} env=${process.env.NODE_ENV ?? "dev"}`);

  mustFile(FOOD_CSV);
  mustFile(FOOD_NUTRIENT_CSV);
  mustFile(NUTRIENT_CSV);

  console.log("🔍 USDA import — čtu CSV…");

  const [foodRows, nutRows, fnRows] = await Promise.all([
    loadCSV<FoodRow>(FOOD_CSV),
    loadCSV<NutrientRow>(NUTRIENT_CSV),
    loadCSV<FoodNutrientRow>(FOOD_NUTRIENT_CSV),
  ]);

  console.log(`📄 food.csv: ${foodRows.length}`);
  console.log(`📄 nutrient.csv: ${nutRows.length}`);
  console.log(`📄 food_nutrient.csv: ${fnRows.length}`);

  // vytvoř mapy nutrient_id <-> name
  const nutrientById = new Map<string, NutrientRow>();
  const idByNameLower = new Map<string, string>();

  for (const n of nutRows) {
    const id = norm(n.id);
    const name = norm(n.name);
    if (!id || !name) continue;
    nutrientById.set(id, n);
    idByNameLower.set(name.toLowerCase(), id);
  }

  // připrav si set nutrient_id, které nás zajímají (podle aliasů)
  const wantedIds: Partial<Record<keyof UsdaMacros, string>> = {};
  for (const [macroKey, aliases] of Object.entries(NUTRIENT_ALIASES) as [keyof UsdaMacros, string[]][]) {
    for (const a of aliases) {
      const id = idByNameLower.get(a.toLowerCase());
      if (id) {
        wantedIds[macroKey] = id;
        break; // jakmile najdeme 1 alias, bereme ho
      }
    }
  }

  // pro ladění: ukaž co se podařilo namapovat
  console.log("🧭 Namapované nutrient_id:");
  for (const k of Object.keys(NUTRIENT_ALIASES) as (keyof UsdaMacros)[]) {
    console.log(`   - ${k}: ${wantedIds[k] ?? "(nenalezeno)"} (${wantedIds[k] ? nutrientById.get(wantedIds[k]!)?.name : ""})`);
  }

  // build → fdc_id -> makra
  const macrosByFdc = new Map<string, UsdaMacros>();
  for (const r of fnRows) {
    const fdcId = norm(r.fdc_id);
    const nid = norm(r.nutrient_id);
    const amount = toNum(r.amount);
    if (!fdcId || !nid || amount == null) continue;

    // zjisti, kterému makru odpovídá
    let macroKey: keyof UsdaMacros | null = null;
    for (const [k, id] of Object.entries(wantedIds) as [keyof UsdaMacros, string][]) {
      if (id === nid) {
        macroKey = k;
        break;
      }
    }
    if (!macroKey) continue;

    const current = macrosByFdc.get(fdcId) || {};
    current[macroKey] = amount;
    macrosByFdc.set(fdcId, current);
  }

  console.log(`🧪 Nalezeno nutričních záznamů pro ${macrosByFdc.size} potravin`);

  // projdi food.csv a vyber jen ty s nějakými makry
  const chosenFoods = foodRows.filter(f => macrosByFdc.has(norm(f.fdc_id)));
  console.log(`📄 Vybráno potravin: ${chosenFoods.length}`);

  let imported = 0;

  for (const f of chosenFoods) {
    const fdcId = norm(f.fdc_id);
    const name = norm(f.description);
    if (!fdcId || !name) continue;

    const m = macrosByFdc.get(fdcId)!;

    // převod jednotek:
    // USDA amount je v g/kcal na 100 g → ukládáme 1:1 do *_100g (nic nepřepočítáváme)
    const payload = {
      energy_kcal_100g: m.energy_kcal_100g ?? null,
      proteins_100g: m.proteins_100g ?? null,
      carbs_100g: m.carbs_100g ?? null,
      sugars_100g: m.sugars_100g ?? null,
      fat_100g: m.fat_100g ?? null,
      saturated_fat_100g: m.saturated_fat_100g ?? null,
      fiber_100g: m.fiber_100g ?? null,
      sodium_100g: m.sodium_100g ?? null,
    };

    // calories_per_gram pro fallback: pokud máme energy_kcal_100g → /100
    const calories_per_gram =
      payload.energy_kcal_100g != null ? Number(payload.energy_kcal_100g) / 100 : null;

    // UPSERT do ingredients podle name (case-insensitive)
    await db.query(
      `
      INSERT INTO ingredients (name, calories_per_gram,
                               energy_kcal_100g, proteins_100g, carbs_100g, sugars_100g,
                               fat_100g, saturated_fat_100g, fiber_100g, sodium_100g)
      VALUES ($1, $2, $3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT (name) DO UPDATE SET
        calories_per_gram     = COALESCE(EXCLUDED.calories_per_gram, ingredients.calories_per_gram),
        energy_kcal_100g      = COALESCE(EXCLUDED.energy_kcal_100g,   ingredients.energy_kcal_100g),
        proteins_100g         = COALESCE(EXCLUDED.proteins_100g,      ingredients.proteins_100g),
        carbs_100g            = COALESCE(EXCLUDED.carbs_100g,         ingredients.carbs_100g),
        sugars_100g           = COALESCE(EXCLUDED.sugars_100g,        ingredients.sugars_100g),
        fat_100g              = COALESCE(EXCLUDED.fat_100g,           ingredients.fat_100g),
        saturated_fat_100g    = COALESCE(EXCLUDED.saturated_fat_100g, ingredients.saturated_fat_100g),
        fiber_100g            = COALESCE(EXCLUDED.fiber_100g,         ingredients.fiber_100g),
        sodium_100g           = COALESCE(EXCLUDED.sodium_100g,        ingredients.sodium_100g)
      `,
      [
        name,
        calories_per_gram,
        payload.energy_kcal_100g,
        payload.proteins_100g,
        payload.carbs_100g,
        payload.sugars_100g,
        payload.fat_100g,
        payload.saturated_fat_100g,
        payload.fiber_100g,
        payload.sodium_100g,
      ]
    );

    imported++;
  }

  console.log(`✅ Hotovo. Naimportováno/aktualizováno: ${imported} položek.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });