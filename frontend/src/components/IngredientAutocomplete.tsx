"use client";

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5050";

/** Jedna ingredience v receptu */
export type IngredientRow = {
  _key?: string;
  name: string;
  amount: number;
  unit: string;
  calories_per_gram: number;
  default_grams?: number;
  display?: string;

  // OFF identifikátor + metadata
  off_id?: string | null;
  brands?: string | null;
  quantity?: string | null;
  image_small_url?: string | null;

  // výživové hodnoty (na 100 g)
  energy_kcal_100g?: number | null;
  proteins_100g?: number | null;
  carbs_100g?: number | null;
  sugars_100g?: number | null;
  fat_100g?: number | null;
  saturated_fat_100g?: number | null;
  fiber_100g?: number | null;
  sodium_100g?: number | null;

  // ✨ vybraný preset (index v poli presets), a lokální cache presetů z návrhu
  __selectedPresetIndex?: number | null;
  __presets?: ServingPreset[] | null;
};

/** Preset porce, jak leží v DB (JSONB) */
export type ServingPreset = {
  path: string; // „stroužek“, „palice“, „menší jablko“…
  g: number;    // kolik gramů odpovídá 1 ks této porce
  unit?: string; // typicky "ks", ale může být i něco jiného
};

/** ===== sjednocený typ návrhu (lokální i OFF) =====
 *  Doplněno o serving_presets z lokální DB.
 */
type Suggestion = {
  source: "local" | "off";
  code: string;                    // uniq klíč – u lokálních String(id), u OFF kód/EAN
  id?: number;                     // jen u lokálních
  name: string;                    // původní (typicky EN)
  name_cs?: string | null;         // český název z DB – RENDEROVAT, KDYŽ JE
  brands?: string | null;
  quantity?: string | null;
  image_small_url?: string | null;
  calories_per_gram?: number | null; // lokální může vracet rovnou kcal/g
  default_grams?: number | null;     // lokální default množství
  serving_presets?: ServingPreset[] | null; // ✨ nové

  patch: {
    off_id: string | null;
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

export type IngredientAutocompleteHandle = {
  getIngredients: () => IngredientRow[];
  setInitialIngredients: (rows: IngredientRow[]) => void;
};

type Props = {
  initialIngredients?: IngredientRow[];
  onChange?: (rows: IngredientRow[]) => void;
};

// --- utils ---
function uid() {
  const g = globalThis as unknown as { crypto?: { randomUUID?: () => string } };
  if (g.crypto && typeof g.crypto.randomUUID === "function") {
    return g.crypto.randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function useDebounced<T>(value: T, delay = 180) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

// odstraní diakritiku, interpunkci, slova typu "raw" apod. a znormalizuje pro deduplikaci
function normalizeLabel(s: string): string {
  const base = (s || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")     // bez diakritiky
    .toLowerCase()
    .replace(/[,.;:()]+/g, " ")
    .replace(/\s+(raw|fresh|uncooked|shelf\s*stable)\b/g, " ") // obecná “šum” slova
    .replace(/\s+/g, " ")
    .trim();

  // jemné aliasy – zatím jen česnek
  if (/(^|\s)garlic(\s|$)/.test(base) || /(^|\s)cesnek(\s|$)/.test(base) || base.includes("strouzek")) {
    return "cesnek";
  }

  return base;
}

// Sjednocení/odstranění duplicit: seskupí návrhy se stejným normalizovaným labelem.
function mergeSuggestions(a: Suggestion[]): Suggestion[] {
  const groups = new Map<string, Suggestion[]>();

  for (const s of a) {
    const label = s.name_cs?.trim() || s.name || "";
    const key = normalizeLabel(label);
    if (!key) continue;
    const list = groups.get(key) ?? [];
    list.push(s);
    groups.set(key, list);
  }

  function score(s: Suggestion): number {
    const hasMacros =
      s.patch?.energy_kcal_100g != null ||
      s.patch?.proteins_100g != null ||
      s.patch?.carbs_100g != null ||
      s.patch?.fat_100g != null;
    if (s.source === "local" && hasMacros) return 100;
    if (s.source === "local") return 90;
    if (s.source === "off" && hasMacros) return 80;
    return 70;
  }

  const out: Suggestion[] = [];
  for (const [, list] of groups) {
    list.sort((a, b) => score(b) - score(a));
    out.push(list[0]);
  }
  out.sort((a, b) => (a.source === b.source ? 0 : a.source === "local" ? -1 : 1));
  return out;
}

// LRU cache
class LRU {
  private map = new Map<string, Suggestion[]>();
  constructor(private max = 200) {}
  get(k: string) {
    if (!this.map.has(k)) return undefined;
    const v = this.map.get(k)!;
    this.map.delete(k);
    this.map.set(k, v);
    return v;
  }
  set(k: string, v: Suggestion[]) {
    if (this.map.has(k)) this.map.delete(k);
    this.map.set(k, v);
    if (this.map.size > this.max) {
      const first = this.map.keys().next().value as string;
      this.map.delete(first);
    }
  }
}
const lru = new LRU(200);

// --- komponenta ---
const IngredientAutocomplete = forwardRef<IngredientAutocompleteHandle, Props>(
  ({ initialIngredients = [], onChange }, ref) => {
    const normalizedInitial =
      initialIngredients && initialIngredients.length
        ? initialIngredients
        : [{ name: "", amount: 0, unit: "g", calories_per_gram: 0 }];

    const [rows, setRows] = useState<IngredientRow[]>(
      normalizedInitial.map((r) => ({
        _key: r._key ?? uid(),
        name: (r.name ?? "") as string,
        amount: Number(r.amount ?? 0),
        unit: (r.unit ?? "g") as string,
        calories_per_gram: Number(r.calories_per_gram ?? 0),
        default_grams: r.default_grams === undefined ? undefined : Number(r.default_grams),
        display: r.display ?? undefined,

        off_id: r.off_id ?? null,
        brands: (r.brands as string | null) ?? null,
        quantity: (r.quantity as string | null) ?? null,
        image_small_url: r.image_small_url ?? null,

        energy_kcal_100g: r.energy_kcal_100g ?? null,
        proteins_100g: r.proteins_100g ?? null,
        carbs_100g: r.carbs_100g ?? null,
        sugars_100g: r.sugars_100g ?? null,
        fat_100g: r.fat_100g ?? null,
        saturated_fat_100g: r.saturated_fat_100g ?? null,
        fiber_100g: r.fiber_100g ?? null,
        sodium_100g: r.sodium_100g ?? null,

        __selectedPresetIndex: null,
        __presets: null,
      }))
    );

    const [queries, setQueries] = useState<string[]>(
      normalizedInitial.map((r) => (r.name ?? "") as string)
    );

    const [suggestions, setSuggestions] = useState<Record<number, Suggestion[]>>({});
    const [highlightIndex, setHighlightIndex] = useState<Record<number, number>>({});

    // jen jeden otevřený dropdown
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const wrapperRef = useRef<HTMLDivElement | null>(null);

    // per-row input refy kvůli focusu
    const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});

    // klik mimo – zavři
    useEffect(() => {
      function onDocMouseDown(e: MouseEvent) {
        if (!wrapperRef.current) return;
        if (!wrapperRef.current.contains(e.target as Node)) {
          setOpenIndex(null);
          setSuggestions({});
          setHighlightIndex({});
        }
      }
      document.addEventListener("mousedown", onDocMouseDown, true);
      return () => document.removeEventListener("mousedown", onDocMouseDown, true);
    }, []);

    useImperativeHandle(ref, () => ({
      getIngredients: () => rows,
      setInitialIngredients: (v: IngredientRow[]) => {
        const list = (v ?? []).map((r) => ({
          _key: r._key ?? uid(),
          name: (r.name ?? "") as string,
          amount: Number(r.amount ?? 0),
          unit: (r.unit ?? "g") as string,
          calories_per_gram: Number(r.calories_per_gram ?? 0),
          default_grams: r.default_grams === undefined ? undefined : Number(r.default_grams),
          display: r.display ?? undefined,

          off_id: r.off_id ?? null,
          brands: (r.brands as string | null) ?? null,
          quantity: (r.quantity as string | null) ?? null,
          image_small_url: r.image_small_url ?? null,

          energy_kcal_100g: r.energy_kcal_100g ?? null,
          proteins_100g: r.proteins_100g ?? null,
          carbs_100g: r.carbs_100g ?? null,
          sugars_100g: r.sugars_100g ?? null,
          fat_100g: r.fat_100g ?? null,
          saturated_fat_100g: r.saturated_fat_100g ?? null,
          fiber_100g: r.fiber_100g ?? null,
          sodium_100g: r.sodium_100g ?? null,

          __selectedPresetIndex: null,
          __presets: null,
        }));

        const safeList =
          list.length > 0
            ? list
            : [{ _key: uid(), name: "", amount: 0, unit: "g", calories_per_gram: 0, __selectedPresetIndex: null, __presets: null } as IngredientRow];

        setRows(safeList);
        setQueries(safeList.map((r) => r.name ?? ""));

        // focus na první řádek
        setTimeout(() => inputRefs.current[0]?.focus(), 0);
      },
    }));

    // propagace do parentu
    useEffect(() => {
      onChange?.(rows);
    }, [rows, onChange]);

    // === hledání (lokál + OFF) ===
    const debouncedQueries = useDebounced(queries, 180);
    const ctrls = useRef<Record<number, AbortController>>({});

    async function fetchLocalDB(q: string, limit: number, signal: AbortSignal): Promise<Suggestion[]> {
      const url = `${API_URL}/api/ingredients/search?` +
        new URLSearchParams({ q, limit: String(limit) }).toString();
      const res = await fetch(url, { signal });
      if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`));
      return (await res.json()) as Suggestion[];
    }

    async function fetchOFF(q: string, limit: number, signal: AbortSignal): Promise<Suggestion[]> {
      const url = `${API_URL}/api/off/search?` +
        new URLSearchParams({ q, limit: String(limit) }).toString();
      const res = await fetch(url, { signal });
      if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`));
      return (await res.json()) as Suggestion[];
    }

    async function fetchBoth(q: string, limit: number, signal: AbortSignal): Promise<Suggestion[]> {
      const [localRes, offRes] = await Promise.allSettled([
        fetchLocalDB(q, limit, signal),
        fetchOFF(q, limit, signal),
      ]);
      const local = localRes.status === "fulfilled" ? localRes.value : [];
      const off = offRes.status === "fulfilled" ? offRes.value : [];
      return mergeSuggestions([...local, ...off]).slice(0, 20);
    }

    useEffect(() => {
      debouncedQueries.forEach(async (term, idx) => {
        const q: string = (term ?? "").trim();
        ctrls.current[idx]?.abort?.();

        if (!q || q.length < 2) {
          setSuggestions((s) => ({ ...s, [idx]: [] }));
          return;
        }

        const cached = lru.get(q);
        if (cached) {
          setSuggestions((s) => ({ ...s, [idx]: cached }));
          setHighlightIndex((h) => ({ ...h, [idx]: -1 }));
        }

        const ctrl = new AbortController();
        ctrls.current[idx] = ctrl;

        try {
          const list = await fetchBoth(q, 20, ctrl.signal);
          lru.set(q, list);
          setSuggestions((s) => ({ ...s, [idx]: list }));
          setHighlightIndex((h) => ({ ...h, [idx]: -1 }));
        } catch (e: unknown) {
          const name = (e as { name?: string })?.name ?? "";
          if (name !== "AbortError") {
            setSuggestions((s) => ({ ...s, [idx]: [] }));
          }
        }
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedQueries]);

    // === manipulace s řádky ===
    const addRowTop = () => {
      const newRow: IngredientRow = {
        _key: uid(),
        name: "",
        amount: 0,
        unit: "g",
        calories_per_gram: 0,
        off_id: null,
        brands: null,
        quantity: null,
        image_small_url: null,
        energy_kcal_100g: null,
        proteins_100g: null,
        carbs_100g: null,
        sugars_100g: null,
        fat_100g: null,
        saturated_fat_100g: null,
        fiber_100g: null,
        sodium_100g: null,
        __selectedPresetIndex: null,
        __presets: null,
      };
      setRows((prev) => [newRow, ...prev]);
      setQueries((prev) => ["", ...prev]);
      setTimeout(() => inputRefs.current[0]?.focus(), 0);
    };

    const removeRow = (index: number) => {
      setRows((prev) => prev.filter((_, i) => i !== index));
      setQueries((prev) => prev.filter((_, i) => i !== index));
      ctrls.current[index]?.abort?.();
      delete ctrls.current[index];
      if (openIndex === index) setOpenIndex(null);
    };

    const updateRow = (index: number, patch: Partial<IngredientRow>) => {
      setRows((prev) =>
        prev.map((r, i) =>
          i === index
            ? {
                ...r,
                ...patch,
                name: (patch.name ?? r.name ?? "") as string,
                unit: (patch.unit ?? r.unit ?? "g") as string,
                calories_per_gram: Number(
                  patch.calories_per_gram ?? r.calories_per_gram ?? 0
                ),
              }
            : r
        )
      );
    };

    /** Po kliknutí na návrh ingredience */
    const selectSuggestion = (index: number, s: Suggestion) => {
      const label = (s.name_cs && s.name_cs.trim()) ? s.name_cs! : s.name;

      const kcalPerGram =
        s.patch?.energy_kcal_100g && s.patch.energy_kcal_100g > 0
          ? s.patch.energy_kcal_100g / 100
          : (s.calories_per_gram ?? 0) || 0;

      const presets = s.serving_presets && s.serving_presets.length ? s.serving_presets : null;

      // pokud existují presety, zkusíme default vybrat první
      const firstPreset = presets?.[0] ?? null;

      updateRow(index, {
        name: label,                                   // uložíme česky
        calories_per_gram: Number(kcalPerGram || 0),
        default_grams: firstPreset ? Number(firstPreset.g) : (s.default_grams ?? undefined),
        unit: firstPreset?.unit ?? (s.default_grams ? "ks" : "g"),

        off_id: (s.patch?.off_id ?? (s.source === "off" ? s.code : null)) || null,
        brands: (s.brands as string | null) ?? null,
        quantity: (s.quantity as string | null) ?? null,
        image_small_url: s.image_small_url ?? null,

        energy_kcal_100g: s.patch?.energy_kcal_100g ?? null,
        proteins_100g: s.patch?.proteins_100g ?? null,
        carbs_100g: s.patch?.carbs_100g ?? null,
        sugars_100g: s.patch?.sugars_100g ?? null,
        fat_100g: s.patch?.fat_100g ?? null,
        saturated_fat_100g: s.patch?.saturated_fat_100g ?? null,
        fiber_100g: s.patch?.fiber_100g ?? null,
        sodium_100g: s.patch?.sodium_100g ?? null,

        __presets: presets,
        __selectedPresetIndex: presets ? 0 : null,
      });

      // nastav text v inputu na český label
      setQueries((prev) => prev.map((q, i) => (i === index ? label : q)));

      // zavři dropdown + zruš probíhající request
      ctrls.current[index]?.abort?.();
      setSuggestions((prev) => ({ ...prev, [index]: [] }));
      setHighlightIndex((h) => ({ ...h, [index]: -1 }));
      setOpenIndex(null);

      // vrať caret do inputu
      setTimeout(() => {
        const el = inputRefs.current[index];
        if (el) {
          el.focus();
          const v = el.value ?? "";
          try {
            el.setSelectionRange(String(v).length, String(v).length);
          } catch {}
        }
      }, 0);
    };

    const onKeyDownList = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      const list = suggestions[index] || [];
      const hi = highlightIndex[index] ?? -1;
      if (!list.length) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = hi < list.length - 1 ? hi + 1 : 0;
        setHighlightIndex((h) => ({ ...h, [index]: next }));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const next = hi > 0 ? hi - 1 : list.length - 1;
        setHighlightIndex((h) => ({ ...h, [index]: next }));
      } else if (e.key === "Enter" && hi >= 0) {
        e.preventDefault();
        selectSuggestion(index, list[hi]);
      } else if (e.key === "Escape") {
        setSuggestions((prev) => ({ ...prev, [index]: [] }));
        if (openIndex === index) setOpenIndex(null);
      }
    };

    /** Když uživatel vybere preset z rozbalovačky v řádku */
    const applyPreset = (rowIndex: number, presetIndex: number) => {
      const r = rows[rowIndex];
      if (!r || !r.__presets || r.__presets.length <= presetIndex) return;
      const p = r.__presets[presetIndex];

      updateRow(rowIndex, {
        __selectedPresetIndex: presetIndex,
        unit: p.unit ?? "ks",
        default_grams: Number(p.g) || 0,
      });
    };

    // === render ===
    return (
      <div ref={wrapperRef} className="space-y-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={addRowTop}
            className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            + Přidat surovinu (nahoru)
          </button>
        </div>

        <div className="space-y-2">
          {rows.map((row, idx) => {
            const list = suggestions[idx] || [];
            const hi = highlightIndex[idx] ?? -1;

            return (
              <div key={row._key} className="grid grid-cols-12 gap-2 items-start relative">
                {/* Název s autocomplete */}
                <div className="col-span-5">
                  <input
                    ref={(el) => {
                      inputRefs.current[idx] = el ?? null;
                    }}
                    type="text"
                    value={(queries[idx] ?? "") as string}
                    onFocus={() => setOpenIndex(idx)}
                    onChange={(e) => {
                      const v: string = e.target.value ?? "";
                      setQueries((prev) => prev.map((q, i) => (i === idx ? v : q)));

                      // ruční přepsání → odpojit OFF i lokální makra
                      updateRow(idx, {
                        name: v,
                        off_id: null,
                        brands: null,
                        quantity: null,
                        image_small_url: null,
                        energy_kcal_100g: null,
                        proteins_100g: null,
                        carbs_100g: null,
                        sugars_100g: null,
                        fat_100g: null,
                        saturated_fat_100g: null,
                        fiber_100g: null,
                        sodium_100g: null,
                        __presets: null,
                        __selectedPresetIndex: null,
                      });

                      setOpenIndex(idx);
                    }}
                    onKeyDown={(e) => onKeyDownList(idx, e)}
                    onBlur={() => {
                      setTimeout(() => {
                        setSuggestions((s) => ({ ...s, [idx]: [] }));
                        if (openIndex === idx) setOpenIndex(null);
                      }, 0);
                    }}
                    placeholder="Začni psát (např. jahoda, brambora, jogurt...)"
                    className="w-full p-2 border rounded"
                    autoComplete="off"
                  />

                  {openIndex === idx && list.length > 0 && (
                    <div className="absolute z-20 bg-white border rounded shadow max-h-64 overflow-y-auto w-full mt-1">
                      {list.map((s, i) => {
                        const label = (s.name_cs && s.name_cs.trim()) ? s.name_cs! : s.name;
                        return (
                          <div
                            key={`${s.source}-${s.code}-${i}`}
                            onMouseDown={(ev) => ev.preventDefault()} // drž fokus v inputu
                            onClick={() => selectSuggestion(idx, s)}
                            className={`p-2 flex items-center gap-2 cursor-pointer ${
                              hi === i ? "bg-gray-100" : "hover:bg-gray-50"
                            }`}
                          >
                            {s.image_small_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={s.image_small_url as string}
                                alt=""
                                width={32}
                                height={32}
                                className="rounded object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded bg-gray-200" />
                            )}
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">
                                {label}
                                {s.source === "local" ? " • (lokální)" : ""}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {/* ✨ zobraz info, že jsou presety */}
                                {s.serving_presets && s.serving_presets.length
                                  ? `Presety: ${s.serving_presets.map(p => p.path).join(", ")}`
                                  : s.source === "off"
                                  ? (s.brands ? `${s.brands} • ` : "") + (s.quantity || "")
                                  : ""}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Množství */}
                <div className="col-span-2">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={Number(row.amount ?? 0)}
                    onChange={(e) =>
                      updateRow(idx, { amount: Number(e.target.value) || 0 })
                    }
                    className="w-full p-2 border rounded text-right"
                    placeholder="množství"
                  />
                </div>

                {/* Jednotka */}
                <div className="col-span-2">
                  <select
                    value={(row.unit ?? "g") as string}
                    onChange={(e) =>
                      updateRow(idx, { unit: (e.target.value ?? "g") as string })
                    }
                    className="w-full p-2 border rounded"
                  >
                    <option value="g">g</option>
                    <option value="ml">ml</option>
                    <option value="ks">ks</option>
                  </select>
                </div>

                {/* kcal/g */}
                <div className="col-span-2">
                  <input
                    type="number"
                    step="0.001"
                    value={Number(row.calories_per_gram ?? 0)}
                    onChange={(e) =>
                      updateRow(idx, {
                        calories_per_gram: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2 border rounded text-right"
                    placeholder="kcal/g"
                  />
                </div>

                {/* Smazat řádek */}
                <div className="col-span-1 flex items-center">
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    className="px-2 py-2 rounded bg-red-50 text-red-700 hover:bg-red-100"
                    title="Smazat surovinu"
                  >
                    ✕
                  </button>
                </div>

                {/* ✨ Presety porcí (pokud jsou) */}
                {row.__presets && row.__presets.length > 0 && (
                  <div className="col-span-12 -mt-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">Porce:</span>
                      <select
                        value={row.__selectedPresetIndex ?? 0}
                        onChange={(e) => applyPreset(idx, Number(e.target.value))}
                        className="p-2 border rounded"
                      >
                        {row.__presets.map((p, i) => (
                          <option key={`${p.path}-${i}`} value={i}>
                            {p.path} ({p.g} g / {p.unit ?? "ks"})
                          </option>
                        ))}
                      </select>
                      <span className="text-gray-400">
                        → nastaví jednotku na <b>{row.__presets[row.__selectedPresetIndex ?? 0]?.unit ?? "ks"}</b> a g/ks na{" "}
                        <b>{row.__presets[row.__selectedPresetIndex ?? 0]?.g ?? "-"}</b>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

IngredientAutocomplete.displayName = "IngredientAutocomplete";
export default IngredientAutocomplete;