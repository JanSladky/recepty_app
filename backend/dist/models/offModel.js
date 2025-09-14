"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.countOFF = countOFF;
exports.searchOFFLocal = searchOFFLocal;
// backend/src/models/offModel.ts
const db_1 = __importDefault(require("../utils/db"));
/** Počet záznamů v lokální OFF tabulce */
async function countOFF() {
    const r = await db_1.default.query("SELECT COUNT(*)::text AS count FROM off_products");
    const count = Number((r.rows?.[0]?.count) ?? 0);
    return count;
}
/** Full-text nad off_products (lokální cache) */
async function searchOFFLocal(q, limit = 15) {
    const term = (q ?? "").trim();
    if (!term)
        return [];
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
    const res = await db_1.default.query(sql, [like, raw, limit]);
    return res.rows.map((r) => ({
        source: "off",
        code: String(r.code),
        name: r.product_name ?? "",
        brands: r.brands ?? "",
        quantity: r.quantity ?? "",
        image_small_url: r.image_small_url ?? null,
        patch: {
            off_id: String(r.code),
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
}
