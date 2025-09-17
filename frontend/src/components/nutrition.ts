// components/nutrition.ts
export const nz = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);

export function computeGrams(
  amount: number,
  unit: string,
  selectedServingGrams?: number | null,
  defaultGrams?: number | null
): number {
  const a = nz(amount);
  const u = String(unit || "g").toLowerCase();
  if (!a) return 0;
  if (u === "g" || u === "ml") return a;

  if (u === "ks") {
    const per =
      (selectedServingGrams != null && nz(selectedServingGrams) > 0)
        ? nz(selectedServingGrams)               // ✅ 1) vybraný preset má PRIORITU
        : nz(defaultGrams);                       // 2) až pak default_grams

    return per > 0 ? a * per : 0;
  }
  return 0;
}