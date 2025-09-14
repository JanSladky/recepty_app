"use client";

import React from "react";

type DonutProps = {
  label: string;
  value: number;       // aktuální hodnota (např. 520 kcal)
  max?: number;        // pro % (např. 2000 kcal/den) – volitelné
  unit?: string;       // "kcal", "g", "mg"...
  subtitle?: string;   // malý popisek dole
};

const DonutChart: React.FC<DonutProps> = ({ label, value, max, unit = "", subtitle }) => {
  const r = 56;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, value);
  const pct = max && max > 0 ? Math.min(100, (clamped / max) * 100) : 0;
  const dash = max ? (pct / 100) * c : (clamped > 0 ? c : 0);

  return (
    <div className="flex flex-col items-center p-3">
      <svg viewBox="0 0 140 140" className="w-28 h-28">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#E5E7EB" strokeWidth="12" />
        <circle
          cx="70" cy="70" r={r} fill="none" strokeWidth="12"
          strokeDasharray={`${dash} ${c - dash}`}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
          className="text-green-600"
          stroke="currentColor"
        />
        <text x="70" y="64" textAnchor="middle" className="fill-gray-800 text-[14px] font-semibold">
          {Math.round(value)}
        </text>
        <text x="70" y="82" textAnchor="middle" className="fill-gray-500 text-[10px]">
          {unit}
        </text>
      </svg>
      <div className="mt-2 text-sm font-medium text-gray-800">{label}</div>
      {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
    </div>
  );
};

export default function NutritionDonuts({
  totals,
  dailyTargets = { kcal: 2000, proteins: 75, carbs: 275, sugars: 50, fat: 70, saturated_fat: 20, fiber: 30, sodium: 2.3 }, // sodium v g ~ 2300 mg
}: {
  totals: {
    kcal: number;
    proteins: number;
    carbs: number;
    sugars: number;
    fat: number;
    saturated_fat: number;
    fiber: number;
    sodium: number; // v gramech (viz backend – vracíme g)
  };
  dailyTargets?: {
    kcal: number; proteins: number; carbs: number; sugars: number; fat: number; saturated_fat: number; fiber: number; sodium: number;
  };
}) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <DonutChart label="Energie" value={totals.kcal} max={dailyTargets.kcal} unit="kcal" subtitle={`z ${dailyTargets.kcal}`} />
        <DonutChart label="Bílkoviny" value={totals.proteins} max={dailyTargets.proteins} unit="g" subtitle={`z ${dailyTargets.proteins} g`} />
        <DonutChart label="Sacharidy" value={totals.carbs} max={dailyTargets.carbs} unit="g" subtitle={`z ${dailyTargets.carbs} g`} />
        <DonutChart label="Cukry" value={totals.sugars} max={dailyTargets.sugars} unit="g" subtitle={`z ${dailyTargets.sugars} g`} />
        <DonutChart label="Tuky" value={totals.fat} max={dailyTargets.fat} unit="g" subtitle={`z ${dailyTargets.fat} g`} />
        <DonutChart label="Nasycené" value={totals.saturated_fat} max={dailyTargets.saturated_fat} unit="g" subtitle={`z ${dailyTargets.saturated_fat} g`} />
        <DonutChart label="Vláknina" value={totals.fiber} max={dailyTargets.fiber} unit="g" subtitle={`z ${dailyTargets.fiber} g`} />
        <DonutChart label="Sodík" value={totals.sodium} max={dailyTargets.sodium} unit="g" subtitle={`z ${dailyTargets.sodium} g`} />
      </div>
    </div>
  );
}