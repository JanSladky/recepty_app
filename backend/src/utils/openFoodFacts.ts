// backend/src/utils/openFoodFacts.ts
export type OFFProduct = {
  id?: string;
  code?: string;
  product_name?: string;
  brands?: string;
  quantity?: string;
  image_small_url?: string;
  nutriments?: {
    "energy-kcal_100g"?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    sugars_100g?: number;
    fat_100g?: number;
    "saturated-fat_100g"?: number;
    fiber_100g?: number;
    sodium_100g?: number;
  };
};

export async function offSearch(query: string, limit = 12): Promise<OFFProduct[]> {
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
    query
  )}&search_simple=1&action=process&json=1&page_size=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OFF search failed: ${res.status}`);
  const data = (await res.json()) as { products?: OFFProduct[] };
  return (data.products ?? []).filter((p) => (p.product_name ?? "").trim() !== "");
}

export async function offGetByCode(code: string): Promise<OFFProduct | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as { product?: OFFProduct };
  return data.product ?? null;
}

export function mapOFFtoIngredientPatch(p: OFFProduct) {
  const n = p.nutriments ?? {};
  return {
    off_id: p.code ?? p.id ?? null,
    energy_kcal_100g: n["energy-kcal_100g"] ?? null,
    proteins_100g: n.proteins_100g ?? null,
    carbs_100g: n.carbohydrates_100g ?? null,
    sugars_100g: n.sugars_100g ?? null,
    fat_100g: n.fat_100g ?? null,
    saturated_fat_100g: n["saturated-fat_100g"] ?? null,
    fiber_100g: n.fiber_100g ?? null,
    sodium_100g: n.sodium_100g ?? null,
  };
}