// backend/scripts/backfill_off_for_existing_ingredients.ts
import dotenv from "dotenv";
dotenv.config();

import db from "../src/utils/db";
import { offSearch, offGetByCode, mapOFFtoIngredientPatch } from "../src/utils/openFoodFacts";

type IngRow = {
  id: number;
  name: string;
  off_id: string | null;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function pickBestOFFMatch(name: string) {
  const q = name.trim();
  if (!q) return null;
  const products = await offSearch(q, 8);
  if (!products.length) return null;

  const lower = q.toLowerCase();
  const exact = products.find((p) => (p.product_name ?? "").trim().toLowerCase() === lower);
  return exact ?? products[0];
}

async function main() {
  console.log("➡️  Backfill OFF pro existující suroviny…");

  const res = await db.query(
    `SELECT id, name, off_id
       FROM ingredients
      WHERE off_id IS NULL
      ORDER BY id ASC`
  );
  const rows = res.rows as IngRow[];

  if (!rows.length) {
    console.log("✅ Není co doplňovat (všechny suroviny už mají off_id).");
    return;
  }

  let linked = 0;
  let skipped = 0;

  for (const ing of rows) {
    try {
      const best = await pickBestOFFMatch(ing.name);
      if (!best) {
        console.log(`⚪ [${ing.id}] ${ing.name} → nenašel jsem produkt na OFF`);
        skipped++;
        await sleep(200);
        continue;
      }

      const code = (best as any).code ?? (best as any).id;
      if (!code) {
        console.log(`⚪ [${ing.id}] ${ing.name} → produkt bez code/id`);
        skipped++;
        await sleep(200);
        continue;
      }

      const full = await offGetByCode(code as string);
      if (!full) {
        console.log(`⚪ [${ing.id}] ${ing.name} → detail produktu ${code} nenalezen`);
        skipped++;
        await sleep(200);
        continue;
      }

      const patch = mapOFFtoIngredientPatch(full);

      await db.query(
        `UPDATE ingredients
            SET off_id = $1,
                energy_kcal_100g = $2,
                proteins_100g = $3,
                carbs_100g = $4,
                sugars_100g = $5,
                fat_100g = $6,
                saturated_fat_100g = $7,
                fiber_100g = $8,
                sodium_100g = $9,
                off_last_synced = NOW()
          WHERE id = $10`,
        [
          patch.off_id,
          patch.energy_kcal_100g,
          patch.proteins_100g,
          patch.carbs_100g,
          patch.sugars_100g,
          patch.fat_100g,
          patch.saturated_fat_100g,
          patch.fiber_100g,
          patch.sodium_100g,
          ing.id,
        ]
      );

      console.log(`✅ [${ing.id}] ${ing.name} → OFF ${patch.off_id} (kcal/100g=${patch.energy_kcal_100g ?? "?"})`);
      linked++;
      await sleep(250);
    } catch (e) {
      console.log(`❌ [${ing.id}] ${ing.name} → chyba:`, (e as Error).message);
      skipped++;
      await sleep(200);
    }
  }

  console.log(`\n🏁 Hotovo. Linked: ${linked}, přeskočeno: ${skipped}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Script failed:", e);
    process.exit(1);
  });