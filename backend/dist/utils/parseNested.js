"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseIngredients = parseIngredients;
/**
 * Vezme objekt polí ve tvaru:
 *  { 'ingredients[0][name]': 'Jogurt', 'ingredients[0][off_id]': '123', ... }
 * a vrátí:
 *  { ingredients: [{ name: 'Jogurt', off_id: '123', ... }, ... ] }
 */
function parseIngredients(fields) {
    const idxMap = new Map();
    const re = /^ingredients\[(\d+)\]\[([^\]]+)\]$/;
    for (const [k, v] of Object.entries(fields)) {
        const m = re.exec(k);
        if (!m)
            continue;
        const index = Number(m[1]);
        const key = m[2];
        if (!idxMap.has(index))
            idxMap.set(index, {});
        const row = idxMap.get(index);
        // číselné konverze u známých polí
        if (["amount", "calories_per_gram", "default_grams",
            "energy_kcal_100g", "proteins_100g", "carbs_100g", "sugars_100g",
            "fat_100g", "saturated_fat_100g", "fiber_100g", "sodium_100g"].includes(key)) {
            row[key] = v === "" || v == null ? null : Number(v);
        }
        else {
            row[key] = v ?? null;
        }
    }
    // seřaď podle indexu a vrať jako array
    const ingredients = [...idxMap.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([, row]) => ({
        // defaulty + vyčištění
        name: String(row.name ?? ""),
        amount: Number(row.amount ?? 0),
        unit: String(row.unit ?? "g"),
        calories_per_gram: Number(row.calories_per_gram ?? 0),
        display: row.display ?? undefined,
        default_grams: row.default_grams == null ? null : Number(row.default_grams),
        // DŮLEŽITÉ: OFF
        off_id: row.off_id ?? null,
        energy_kcal_100g: row.energy_kcal_100g == null ? null : Number(row.energy_kcal_100g),
        proteins_100g: row.proteins_100g == null ? null : Number(row.proteins_100g),
        carbs_100g: row.carbs_100g == null ? null : Number(row.carbs_100g),
        sugars_100g: row.sugars_100g == null ? null : Number(row.sugars_100g),
        fat_100g: row.fat_100g == null ? null : Number(row.fat_100g),
        saturated_fat_100g: row.saturated_fat_100g == null ? null : Number(row.saturated_fat_100g),
        fiber_100g: row.fiber_100g == null ? null : Number(row.fiber_100g),
        sodium_100g: row.sodium_100g == null ? null : Number(row.sodium_100g),
        // volitelná kosmetika
        brands: row.brands ?? null,
        quantity: row.quantity ?? null,
        image_small_url: row.image_small_url ?? null,
    }));
    return { ingredients };
}
