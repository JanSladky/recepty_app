"use client";

import React from "react";

export type ServingPreset = { label: string; grams: number };

type Props = {
  /** Aktuální pole presetů (řízená hodnota z rodiče) */
  value: ServingPreset[];
  /** Vrací nové pole při změně */
  onChange: (next: ServingPreset[]) => void;
  /** Volitelně – nadpis/form label */
  label?: string;
};

export default function ServingPresetsEditor({ value, onChange, label = "Předvolby porcí" }: Props) {
  const addRow = () => onChange([...value, { label: "", grams: 0 }]);
  const removeRow = (idx: number) => onChange(value.filter((_, i) => i !== idx));
  const updateRow = (idx: number, patch: Partial<ServingPreset>) =>
    onChange(
      value.map((row, i) => (i === idx ? { ...row, ...patch, grams: Number(patch.grams ?? row.grams) } : row))
    );

  return (
    <div className="rounded-xl border bg-white shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold">{label}</h4>
        <button
          type="button"
          onClick={addRow}
          className="text-sm px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700"
        >
          + přidat předvolbu
        </button>
      </div>

      {value.length === 0 && (
        <div className="text-sm text-gray-500">Zatím žádné předvolby. Přidej třeba „stroužek (3 g)“ nebo „plátek (20 g)“.</div>
      )}

      <div className="space-y-3">
        {value.map((row, idx) => (
          <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <div className="sm:col-span-7">
              <input
                type="text"
                value={row.label}
                onChange={(e) => updateRow(idx, { label: e.target.value })}
                placeholder="název (např. plátek, stroužek, porce…) "
                className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
            <div className="sm:col-span-3">
              <div className="flex">
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={Number.isFinite(row.grams) ? row.grams : 0}
                  onChange={(e) => updateRow(idx, { grams: Number(e.target.value) })}
                  placeholder="g"
                  className="w-full rounded-l-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
                />
                <span className="inline-flex items-center px-3 rounded-r-lg border border-l-0 bg-gray-50 text-gray-600">
                  g
                </span>
              </div>
            </div>
            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={() => removeRow(idx)}
                className="w-full rounded-lg border px-3 py-2 hover:bg-red-50 text-red-600"
              >
                Odebrat
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}