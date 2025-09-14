// backend/src/controllers/offController.ts
import type { Request, Response } from "express";
import db from "../utils/db";
import { offSearch, offGetByCode, mapOFFtoIngredientPatch } from "../utils/openFoodFacts";

export async function searchOFF(req: Request, res: Response) {
  try {
    const q = String(req.query.q ?? "").trim();
    if (!q) return res.status(400).json({ error: "Missing q" });

    const products = await offSearch(q, 12);
    const out = products.map((p) => ({
      source: "off" as const,
      code: p.code ?? p.id ?? null,
      name: p.product_name ?? "",
      brands: p.brands ?? "",
      quantity: p.quantity ?? "",
      image_small_url: p.image_small_url ?? "",
      patch: mapOFFtoIngredientPatch(p),
    }));
    res.json(out);
  } catch (e) {
    console.error("OFF search error:", e);
    res.status(500).json({ error: "OFF search failed" });
  }
}

export async function getOFFByCode(req: Request, res: Response) {
  try {
    const code = req.params.code;
    const p = await offGetByCode(code);
    if (!p) return res.status(404).json({ error: "Not found" });

    res.json({
      code: p.code ?? p.id ?? null,
      name: p.product_name ?? "",
      brands: p.brands ?? "",
      quantity: p.quantity ?? "",
      image_small_url: p.image_small_url ?? "",
      patch: mapOFFtoIngredientPatch(p),
    });
  } catch (e) {
    console.error("OFF getByCode error:", e);
    res.status(500).json({ error: "OFF getByCode failed" });
  }
}

export async function linkIngredientToOFF(req: Request, res: Response) {
  try {
    const { ingredient_id, off_code } = req.body as { ingredient_id?: number; off_code?: string };
    if (!ingredient_id || !off_code) return res.status(400).json({ error: "Missing ingredient_id/off_code" });

    const p = await offGetByCode(off_code);
    if (!p) return res.status(404).json({ error: "OFF product not found" });

    const patch = mapOFFtoIngredientPatch(p);

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
        ingredient_id,
      ]
    );

    res.json({ ok: true });
  } catch (e) {
    console.error("OFF link error:", e);
    res.status(500).json({ error: "OFF link failed" });
  }
}