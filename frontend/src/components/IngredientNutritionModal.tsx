"use client";

import { useEffect, useMemo } from "react";

/* ========= Typy ========= */

export type ServingPreset = {
  label: string;
  grams: number;
  unit?: string;
  inflect?: { one?: string; few?: string; many?: string };
};

export type IngredientForModal = {
  name: string;
  amount: number;
  unit: string;                 // "g" | "ml" | "ks" | ...
  default_grams: number | null; // g/ks
  selectedServingGrams: number | null; // g/ks (má prioritu)
  servingPresets?: ServingPreset[];
  name_genitive?: string | null;

  // hodnoty na 100 g (nepovinné)
  energy_kcal_100g?: number | null;
  proteins_100g?: number | null;
  carbs_100g?: number | null;
  sugars_100g?: number | null;
  fat_100g?: number | null;
  saturated_fat_100g?: number | null;
  fiber_100g?: number | null;
  sodium_100g?: number | null;

  // rozšířené položky (na 100 g)
  trans_fat_100g?: number | null;
  mono_fat_100g?: number | null;
  poly_fat_100g?: number | null;
  cholesterol_mg_100g?: number | null; // mg
  salt_100g?: number | null;
  calcium_mg_100g?: number | null;     // mg
  water_100g?: number | null;
  phe_mg_100g?: number | null;         // mg
};

type Props = {
  open: boolean;
  onClose: () => void;
  ingredient: IngredientForModal;
};

/* ========= Helpers ========= */

const nz = (v: unknown): number => (Number.isFinite(Number(v)) ? Number(v) : 0);

const round = (v: number, digits = 2) => {
  const f = Math.pow(10, digits);
  return Math.round(v * f) / f;
};

function gramsForIngredient(ing: IngredientForModal): number {
  const amount = nz(ing.amount);
  const unit = String(ing.unit || "g").toLowerCase();
  if (amount <= 0) return 0;
  if (unit === "g" || unit === "ml") return amount;
  if (unit === "ks") {
    const perPiece =
      nz(ing.selectedServingGrams) > 0 ? nz(ing.selectedServingGrams) : nz(ing.default_grams);
    return perPiece > 0 ? amount * perPiece : 0;
  }
  // neznámá jednotka → bez přepočtu
  return 0;
}

/** Klíče maker, které renderujeme (vše „na 100 g“) */
type MacroKey100g = keyof Pick<
  IngredientForModal,
  | "energy_kcal_100g"
  | "proteins_100g"
  | "carbs_100g"
  | "sugars_100g"
  | "fat_100g"
  | "saturated_fat_100g"
  | "fiber_100g"
  | "sodium_100g"
  | "trans_fat_100g"
  | "mono_fat_100g"
  | "poly_fat_100g"
  | "cholesterol_mg_100g"
  | "salt_100g"
  | "calcium_mg_100g"
  | "water_100g"
  | "phe_mg_100g"
>;

type MacroRow = {
  key: MacroKey100g;
  label: string;
  unit: "kcal" | "g" | "mg";
};

/** Pořadí a popisky řádků v tabulce */
const ROWS: MacroRow[] = [
  { key: "energy_kcal_100g", label: "Energie", unit: "kcal" },
  { key: "proteins_100g", label: "Bílkoviny", unit: "g" },
  { key: "carbs_100g", label: "Sacharidy", unit: "g" },
  { key: "sugars_100g", label: "Cukry", unit: "g" },
  { key: "fat_100g", label: "Tuky", unit: "g" },
  { key: "saturated_fat_100g", label: "Nasycené", unit: "g" },
  { key: "trans_fat_100g", label: "Trans mastné", unit: "g" },
  { key: "mono_fat_100g", label: "Mono nenasycené", unit: "g" },
  { key: "poly_fat_100g", label: "Poly nenasycené", unit: "g" },
  { key: "fiber_100g", label: "Vláknina", unit: "g" },
  { key: "salt_100g", label: "Sůl", unit: "g" },
  { key: "sodium_100g", label: "Sodík", unit: "g" },
  { key: "cholesterol_mg_100g", label: "Cholesterol", unit: "mg" },
  { key: "calcium_mg_100g", label: "Vápník", unit: "mg" },
  { key: "water_100g", label: "Voda", unit: "g" },
  { key: "phe_mg_100g", label: "Fenylalanin (PHE)", unit: "mg" },
];

/* ========= Komponenta ========= */

export default function IngredientNutritionModal({ open, onClose, ingredient }: Props) {
  // Hooky vždy nahoře a bez podmínek
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  const grams = useMemo(() => gramsForIngredient(ingredient), [ingredient]);

  // Přepočet z 100 g na aktuální množství
  const perAmount = useMemo(() => {
    const factor = grams > 0 ? grams / 100 : 0;

    const get = (k: MacroKey100g): number | null => {
      const v = ingredient[k];
      if (v == null) return null;
      const base = nz(v);
      // u kcal zaokrouhlujeme na celé, jinak na 2 desetinná
      const digits = k === "energy_kcal_100g" ? 0 : 2;
      return round(base * factor, digits);
    };

    const result = {} as Record<MacroKey100g, number | null>;
    for (const r of ROWS) {
      result[r.key] = get(r.key);
    }
    return result;
  }, [grams, ingredient]);

  // Info badge „g/ks“
  const pieceInfo = useMemo(() => {
    const perPiece =
      nz(ingredient.selectedServingGrams) > 0 ? nz(ingredient.selectedServingGrams) : nz(ingredient.default_grams);
    return perPiece > 0 ? `${perPiece} g/ks` : null;
  }, [ingredient.selectedServingGrams, ingredient.default_grams]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-[48rem] md:max-w-[56rem] bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-4 sm:p-6 border-b bg-gray-50">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold leading-tight truncate">
              {ingredient.name}
            </h2>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                {ingredient.amount} {ingredient.unit}
              </span>
              {pieceInfo && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                  {pieceInfo}
                </span>
              )}
              {grams > 0 && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-200 text-gray-900">
                  {grams} g celkem
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800"
            aria-label="Zavřít"
          >
            Zavřít
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[72vh] overflow-y-auto">
          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full text-sm md:text-base">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b">
                  <th className="text-left font-semibold px-4 py-3 w-[40%]">Položka</th>
                  <th className="text-right font-semibold px-4 py-3 w-[30%]">na 100 g</th>
                  <th className="text-right font-semibold px-4 py-3 w-[30%]">
                    {grams > 0 ? `na ${grams} g` : "na množství"}
                  </th>
                </tr>
              </thead>

              <tbody className="[&_tr:nth-child(odd)]:bg-gray-50">
                {ROWS.map((row) => {
                  const per100 = ingredient[row.key] ?? null;
                  const perAmt = perAmount[row.key];

                  const fmt = (v: number | null): string => {
                    if (v == null) return "—";
                    if (row.unit === "kcal") return `${Math.round(v).toLocaleString("cs-CZ")} ${row.unit}`;
                    if (row.unit === "mg") return `${Math.round(v).toLocaleString("cs-CZ")} ${row.unit}`;
                    return `${round(v, 2).toLocaleString("cs-CZ")} ${row.unit}`;
                  };

                  return (
                    <tr key={row.key} className="border-b last:border-b-0">
                      <td className="px-4 py-3">{row.label}</td>
                      <td className="px-4 py-3 text-right text-gray-700 tabular-nums">
                        {fmt(per100)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">
                        {fmt(perAmt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Presety porcí */}
          {Array.isArray(ingredient.servingPresets) && ingredient.servingPresets.length > 0 && (
            <div className="p-4 sm:p-6">
              <div className="text-sm text-gray-600 mb-2">Předvolby porcí</div>
              <div className="flex flex-wrap gap-2">
                {ingredient.servingPresets.map((p, idx) => (
                  <span
                    key={`${p.label}-${idx}`}
                    className="text-xs px-2 py-1 rounded-full border bg-white"
                    title={p.unit && p.unit !== "ks" ? p.unit : undefined}
                  >
                    {p.label} · {p.grams} g{p.unit && p.unit !== "ks" ? ` · ${p.unit}` : ""}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Poznámka */}
          <p className="px-4 sm:px-6 pb-5 text-xs text-gray-500">
            Hodnoty jsou přepočítané z údajů uvedených na 100&nbsp;g. Pokud je u položky „—“, zdroj daný údaj neposkytl.
          </p>
        </div>
      </div>
    </div>
  );
}