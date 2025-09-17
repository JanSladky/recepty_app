"use client";

import { useEffect, useMemo, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5050";

/* ========= Typy ========= */

export type ServingPreset = {
  label: string;
  grams: number;
  unit?: string;
  inflect?: { one?: string; few?: string; many?: string };
};

export type IngredientForModal = {
  id?: number;                 // ← důležité: pokud dorazí, použijeme ho pro dofetch
  name: string;
  amount: number;
  unit: string;                // "g" | "ml" | "ks" | ...
  default_grams: number | null;        // g/ks
  selectedServingGrams: number | null;  // g/ks (má prioritu)
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

/* ========= Normalizační helpery (bez any) ========= */

const asRecord = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" ? (v as Record<string, unknown>) : {};

const numOrNull = (v: unknown): number | null => {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const pickFrom = (obj: Record<string, unknown>, keys: string[]): unknown => {
  for (const k of keys) {
    if (obj[k] != null) return obj[k];
  }
  return null;
};

const normalizePreset = (p: unknown): ServingPreset => {
  const r = asRecord(p);
  const inf = asRecord(r["inflect"]);
  const label = String((r["label"] ?? "") as string);
  const grams = Number(r["grams"] ?? 0) || 0;
  const unit = (r["unit"] as string) ?? "ks";

  const one = typeof inf["one"] === "string" ? (inf["one"] as string) : undefined;
  const few = typeof inf["few"] === "string" ? (inf["few"] as string) : undefined;
  const many = typeof inf["many"] === "string" ? (inf["many"] as string) : undefined;

  const inflect =
    one || few || many
      ? {
          one,
          few,
          many,
        }
      : undefined;

  return { label, grams, unit, inflect };
};

/* ========= Normalizace vstupu ========= */

const normalizeIngredientForModal = (raw: unknown): IngredientForModal => {
  const r = asRecord(raw);

  // sjednocení presetů: serving_presets (backend) -> servingPresets (frontend)
  const sp1 = r["serving_presets"];
  const sp2 = r["servingPresets"];
  const presetsRaw: unknown[] = Array.isArray(sp1) ? sp1 : Array.isArray(sp2) ? (sp2 as unknown[]) : [];
  const presets: ServingPreset[] = presetsRaw.map(normalizePreset);

  // zkus i vnořené objekty raw.nutrition / raw.nutrients
  const nutrition = asRecord(r["nutrition"]);
  const nutrients = asRecord(r["nutrients"]);
  const getVal = (keys: string[]) => pickFrom(r, keys) ?? pickFrom(nutrition, keys) ?? pickFrom(nutrients, keys);

  return {
    // povinné pro modal
    id: r["id"] == null ? undefined : Number(r["id"]),
    name: String((r["name"] ?? "") as string),
    amount: Number(r["amount"] ?? 0),
    unit: String((r["unit"] ?? "g") as string),
    default_grams: numOrNull(getVal(["default_grams", "grams_per_piece", "gramsPerPiece"])),
    selectedServingGrams: numOrNull(getVal(["selectedServingGrams", "selected_serving_grams"])),
    servingPresets: presets,
    name_genitive: (getVal(["name_genitive", "nameGenitive"]) as string) ?? null,

    // výživa na 100 g
    energy_kcal_100g: numOrNull(getVal(["energy_kcal_100g", "energy_kcal"])),
    proteins_100g: numOrNull(getVal(["proteins_100g", "protein_100g", "proteins"])),
    carbs_100g: numOrNull(getVal(["carbs_100g", "carbohydrates_100g", "carbs"])),
    sugars_100g: numOrNull(getVal(["sugars_100g", "sugar_100g", "sugars"])),
    fat_100g: numOrNull(getVal(["fat_100g", "fats_100g", "fat"])),
    saturated_fat_100g: numOrNull(getVal(["saturated_fat_100g", "saturated_fats_100g", "saturated_fat"])),
    fiber_100g: numOrNull(getVal(["fiber_100g", "fibre_100g", "fiber"])),
    sodium_100g: numOrNull(getVal(["sodium_100g", "sodium"])),

    // rozšířené položky (na 100 g)
    trans_fat_100g: numOrNull(getVal(["trans_fat_100g", "trans_fat"])),
    mono_fat_100g: numOrNull(getVal(["mono_fat_100g", "mono_unsat_fat_100g", "mono_fat"])),
    poly_fat_100g: numOrNull(getVal(["poly_fat_100g", "poly_unsat_fat_100g", "poly_fat"])),
    cholesterol_mg_100g: numOrNull(getVal(["cholesterol_mg_100g", "cholesterol_100g_mg", "cholesterol_mg", "cholesterol"])),
    salt_100g: numOrNull(getVal(["salt_100g", "salt", "salt_per_100g"])),
    calcium_mg_100g: numOrNull(getVal(["calcium_mg_100g", "calcium", "calcium_mg"])),
    water_100g: numOrNull(getVal(["water_100g", "water"])),
    phe_mg_100g: numOrNull(getVal(["phe_mg_100g", "phe", "phe_mg"])),
  };
};

/* ========= Fallback: dohledání ID podle názvu ========= */

async function resolveIngredientIdByName(name: string): Promise<number | undefined> {
  if (!name) return undefined;

  try {
    // Preferovaná rychlá route (pokud ji máš)
    const r1 = await fetch(`${API_URL}/api/ingredients/resolve?name=${encodeURIComponent(name)}`);
    if (r1.ok) {
      const data = await r1.json().catch(() => null as unknown);
      const id = Number((asRecord(data))["id"]);
      if (Number.isFinite(id)) return id;
    }
  } catch {/* ignore */}

  try {
    // Fallback: search → první shoda
    const r2 = await fetch(`${API_URL}/api/ingredients/search?q=${encodeURIComponent(name)}&limit=1`);
    if (r2.ok) {
      const arr = (await r2.json().catch(() => [] as unknown)) as unknown;
      const list = Array.isArray(arr) ? arr : [];
      const first = asRecord(list[0]);
      const id = Number(first["id"]);
      if (Number.isFinite(id)) return id;
    }
  } catch {/* ignore */}

  return undefined;
}

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
    const perPiece = nz(ing.selectedServingGrams) > 0 ? nz(ing.selectedServingGrams) : nz(ing.default_grams);
    return perPiece > 0 ? amount * perPiece : 0;
  }
  return 0; // neznámá jednotka
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
  // 1) Normalizace příchozích dat
  const ing = useMemo(() => normalizeIngredientForModal(ingredient), [ingredient]);

  // 2) Lokální „plná“ verze (po dofetchnutí z backendu sem slejeme vše)
  const [full, setFull] = useState<IngredientForModal>(ing);
  const [loadingFull, setLoadingFull] = useState(false);

  // 3) Dofetch „full“: když chybí klíčové hodnoty NEBO chybí id (pak zkusíme dohledat id podle názvu)
  useEffect(() => {
    setFull(ing);

    const missingAny =
      ing.energy_kcal_100g == null ||
      ing.proteins_100g == null ||
      ing.fat_100g == null ||
      ing.salt_100g == null ||
      ing.sodium_100g == null ||
      ing.cholesterol_mg_100g == null ||
      !Array.isArray(ing.servingPresets) ||
      ing.servingPresets.length === 0;

    if (!missingAny && ing.id) return;

    let abort = false;
    (async () => {
      try {
        setLoadingFull(true);

        // a) nemám id → dohledat podle názvu
        let idToUse = ing.id;
        if (!idToUse) {
          idToUse = await resolveIngredientIdByName(ing.name);
          if (abort) return;
          if (idToUse) {
            setFull((prev) => normalizeIngredientForModal({ ...prev, id: idToUse }));
          }
        }

        // b) když máme id → stáhni detail
        if (idToUse) {
          const res = await fetch(`${API_URL}/api/ingredients/${idToUse}?format=full`);
          if (!res.ok) {
            const t = await res.text().catch(() => "");
            console.warn("[MODAL] fetch /ingredients/:id fail", res.status, t);
            return;
          }
          const data = await res.json();
          if (abort) return;
          setFull(normalizeIngredientForModal({ ...ing, ...data, id: idToUse }));
          return;
        }

        // c) poslední pokus – search → detail prvního
        const sr = await fetch(`${API_URL}/api/ingredients/search?q=${encodeURIComponent(ing.name)}&limit=1&format=full`);
        if (!sr.ok) return;
        const arr = await sr.json().catch(() => []);
        const first = Array.isArray(arr) ? arr[0] : null;
        if (!first) return;
        const fallbackId = Number(asRecord(first)["id"]);
        if (!Number.isFinite(fallbackId)) return;

        const fr = await fetch(`${API_URL}/api/ingredients/${fallbackId}?format=full`);
        if (!fr.ok) return;
        const fd = await fr.json();
        if (abort) return;
        setFull(normalizeIngredientForModal({ ...ing, ...fd, id: fallbackId }));
      } catch (e) {
        console.error("[MODAL] detail fetch error", e);
      } finally {
        if (!abort) setLoadingFull(false);
      }
    })();

    return () => {
      abort = true;
    };
  }, [ing]);

  // 4) Escape pro zavření
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  // 5) Výpočty
  const grams = useMemo(() => gramsForIngredient(full), [full]);

  const perAmount = useMemo(() => {
    const factor = grams > 0 ? grams / 100 : 0;

    const get = (k: MacroKey100g): number | null => {
      const v = full[k];
      if (v == null) return null;
      const base = nz(v);
      const digits = k === "energy_kcal_100g" ? 0 : 2;
      return round(base * factor, digits);
    };

    const result = {} as Record<MacroKey100g, number | null>;
    for (const r of ROWS) result[r.key] = get(r.key);
    return result;
  }, [grams, full]);

  const pieceInfo = useMemo(() => {
    const perPiece = nz(full.selectedServingGrams) > 0 ? nz(full.selectedServingGrams) : nz(full.default_grams);
    return perPiece > 0 ? `${perPiece} g/ks` : null;
  }, [full.selectedServingGrams, full.default_grams]);

  if (!open) return null;

  /* ========= UI ========= */
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-[48rem] md:max-w-[56rem] bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-4 sm:p-6 border-b bg-gray-50">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold leading-tight truncate">{full.name}</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                {full.amount} {full.unit}
              </span>
              {pieceInfo && <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">{pieceInfo}</span>}
              {grams > 0 && <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-200 text-gray-900">{grams} g celkem</span>}
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
          {loadingFull && <div className="px-4 py-3 text-sm text-gray-500">Načítám detailní výživu…</div>}

          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full text-sm md:text-base">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b">
                  <th className="text-left font-semibold px-4 py-3 w-[40%]">Položka</th>
                  <th className="text-right font-semibold px-4 py-3 w-[30%]">na 100 g</th>
                  <th className="text-right font-semibold px-4 py-3 w-[30%]">{grams > 0 ? `na ${grams} g` : "na množství"}</th>
                </tr>
              </thead>

              <tbody className="[&_tr:nth-child(odd)]:bg-gray-50">
                {ROWS.map((row) => {
                  const per100 = full[row.key] ?? null;
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
                      <td className="px-4 py-3 text-right text-gray-700 tabular-nums">{fmt(per100)}</td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">{fmt(perAmt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Presety porcí */}
          {Array.isArray(full.servingPresets) && full.servingPresets.length > 0 && (
            <div className="p-4 sm:p-6">
              <div className="text-sm text-gray-600 mb-2">Předvolby porcí</div>
              <div className="flex flex-wrap gap-2">
                {full.servingPresets.map((p, idx) => (
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