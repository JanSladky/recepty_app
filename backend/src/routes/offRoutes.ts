// backend/src/routes/offRoutes.ts
import { Router } from "express";
import db from "../utils/db";

const router = Router();

// /api/off/count – info pro debug
router.get("/count", async (_req, res) => {
  const r = await db.query("select count(*)::int as count from off_products");
  res.json({ count: r.rows[0]?.count ?? 0 });
});

// /api/off/search?q=...
router.get("/search", async (req, res) => {
  const q = (req.query.q as string)?.trim() ?? "";
  if (q.length < 2) return res.json([]);               // krátké dotazy neřešíme

  // ⚡ rychlé přes trigram index (pg_trgm), který už máš vytvořený
  const sql = `
    select
      code,
      product_name,
      brands,
      quantity,
      image_small_url,
      energy_kcal_100g, proteins_100g, carbs_100g, sugars_100g,
      fat_100g, saturated_fat_100g, fiber_100g, sodium_100g
    from off_products
    where product_name ilike $1 or brands ilike $1
    order by product_name asc
    limit 15
  `;
  const like = `%${q}%`;
  const { rows } = await db.query(sql, [like]);

  const out = rows.map((r: any) => ({
    source: "off" as const,
    code: r.code,
    name: r.product_name,
    brands: r.brands,
    quantity: r.quantity,
    image_small_url: r.image_small_url,
    patch: {
      off_id: r.code,
      energy_kcal_100g: r.energy_kcal_100g ?? null,
      proteins_100g: r.proteins_100g ?? null,
      carbs_100g: r.carbs_100g ?? null,
      sugars_100g: r.sugars_100g ?? null,
      fat_100g: r.fat_100g ?? null,
      saturated_fat_100g: r.saturated_fat_100g ?? null,
      fiber_100g: r.fiber_100g ?? null,
      sodium_100g: r.sodium_100g ?? null,
    },
  }));

  res.json(out);
});

export default router;