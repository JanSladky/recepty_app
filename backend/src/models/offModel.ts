// backend/src/models/offModel.ts
import db from "../utils/db";

/** Tvar položky pro našeptávač (co čeká FE) */
export type OFFSuggestion = {
  source: "off";
  code: string;
  name: string;
  brands?: string;
  quantity?: string;
  image_small_url?: string | null;
  patch: {
    off_id: string;
    energy_kcal_100g: number | null;
    proteins_100g: number | null;
    carbs_100g: number | null;
    sugars_100g: number | null;
    fat_100g: number | null;
    saturated_fat_100g: number | null;
    fiber_100g: number | null;
    sodium_100g: number | null;
  };
};

/** Počet záznamů v lokální OFF tabulce */
export async function countOFF(): Promise<number> {
  const r = await db.query("SELECT COUNT(*)::text AS count FROM off_products");
  const count = Number(((r.rows?.[0] as any)?.count) ?? 0);
  return count;
}

/** Full-text nad off_products (lokální cache) */
export async function searchOFFLocal(q: string, limit = 15): Promise<OFFSuggestion[]> {
  const term = (q ?? "").trim();
  if (!term) return [];

  const like = `%${term}%`;
  const raw = term;

  const sql = `
    SELECT
      code,
      product_name,
      brands,
      quantity,
      image_small_url,
      energy_kcal_100g,
      proteins_100g,
      carbs_100g,
      sugars_100g,
      fat_100g,
      saturated_fat_100g,
      fiber_100g,
      sodium_100g
    FROM off_products
    WHERE
      unaccent(product_name) ILIKE unaccent($1)
      OR unaccent(brands)     ILIKE unaccent($1)
      OR product_name % $2
      OR brands       % $2
    ORDER BY
      GREATEST(
        similarity(unaccent(product_name), unaccent($2)),
        similarity(unaccent(brands),       unaccent($2))
      ) DESC,
      product_name ASC
    LIMIT $3
  `;

  const res = await db.query(sql, [like, raw, limit]);

  return (res.rows as any[]).map((r) => ({
    source: "off",
    code: String(r.code),
    name: r.product_name ?? "",
    brands: r.brands ?? "",
    quantity: r.quantity ?? "",
    image_small_url: r.image_small_url ?? null,
    patch: {
      off_id: String(r.code),
      energy_kcal_100g: r.energy_kcal_100g ?? null,
      proteins_100g:    r.proteins_100g ?? null,
      carbs_100g:       r.carbs_100g ?? null,
      sugars_100g:      r.sugars_100g ?? null,
      fat_100g:         r.fat_100g ?? null,
      saturated_fat_100g: r.saturated_fat_100g ?? null,
      fiber_100g:       r.fiber_100g ?? null,
      sodium_100g:      r.sodium_100g ?? null,
    },
  }));
}