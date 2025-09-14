"use client";

import React from "react";

export type IngredientForModal = {
  name: string;
  amount: number;         // množství v receptu
  unit: string;           // "g" | "ml" | "ks"
  default_grams?: number | null;
  // OFF per 100 g:
  energy_kcal_100g?: number | null;
  proteins_100g?: number | null;
  carbs_100g?: number | null;
  sugars_100g?: number | null;
  fat_100g?: number | null;
  saturated_fat_100g?: number | null;
  fiber_100g?: number | null;
  sodium_100g?: number | null;
};

export default function IngredientNutritionModal({
  open, onClose, ingredient,
}: {
  open: boolean;
  onClose: () => void;
  ingredient: IngredientForModal | null;
}) {
  if (!open || !ingredient) return null;

  const grams =
    ingredient.unit === "ks"
      ? (ingredient.default_grams ?? 0) * (ingredient.amount ?? 0)
      : (ingredient.amount ?? 0);

  const f = (x?: number | null) => (x == null ? "—" : Math.round((x / 100) * grams * 10) / 10);

  const rows = [
    ["Energie", f(ingredient.energy_kcal_100g), "kcal"],
    ["Bílkoviny", f(ingredient.proteins_100g), "g"],
    ["Sacharidy", f(ingredient.carbs_100g), "g"],
    ["Cukry", f(ingredient.sugars_100g), "g"],
    ["Tuky", f(ingredient.fat_100g), "g"],
    ["Nasycené", f(ingredient.saturated_fat_100g), "g"],
    ["Vláknina", f(ingredient.fiber_100g), "g"],
    ["Sodík", f(ingredient.sodium_100g), "g"],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[min(92vw,560px)] p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">{ingredient.name}</h3>
          <button onClick={onClose} className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200">Zavřít</button>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          Množství v receptu: <strong>{grams || 0} g</strong>
          {ingredient.unit === "ks" && ingredient.default_grams ? " (přepočet z ks)" : ""}
        </p>
        <table className="w-full text-sm">
          <tbody>
            {rows.map(([label, val, unit]) => (
              <tr key={label as string} className="border-t">
                <td className="py-2 text-gray-600">{label}</td>
                <td className="py-2 text-right font-medium">{val}</td>
                <td className="py-2 text-gray-500 pl-2">{unit as string}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-gray-500 mt-3">Hodnoty přepočteny z údajů na 100 g (Open Food Facts).</p>
      </div>
    </div>
  );
}