"use client";

import { useEffect, useState } from "react";
import useAdmin from "@/hooks/useAdmin";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

const UNIT_OPTIONS = ["g", "ml", "ks"] as const;
type UnitOption = typeof UNIT_OPTIONS[number];

/* ---------------- Icons ---------------- */
const IconSave = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

const IconTrash = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

/* ---------------- Typy ---------------- */
export type ServingPreset = {
  label: string;
  grams: number;
  unit?: string; // default "ks" na backendu
  inflect?: { one?: string; few?: string; many?: string };
};

export type Ingredient = {
  id: number;
  name: string;
  name_cs: string | null;
  category_id: number | null;
  unit_name: string | null; // např. "g" | "ml" | "ks" (volitelné, jen text)
  default_grams: number | null; // *** POVINNÉ: kolik gramů má 1 ks ***
  calories_per_gram: number | null;
  off_id: string | null; // v UI neschováváme, necháme jen v typu
  name_genitive?: string | null;

  /* makra / minerály – na 100 g */
  energy_kcal_100g: number | null;
  proteins_100g: number | null;
  carbs_100g: number | null;
  sugars_100g: number | null;
  fat_100g: number | null;
  saturated_fat_100g: number | null;
  fiber_100g: number | null;
  sodium_100g: number | null;

  /* ⬇️ NOVÉ POLOŽKY (na 100 g) */
  trans_fat_100g?: number | null; // g
  mono_fat_100g?: number | null; // g
  poly_fat_100g?: number | null; // g
  cholesterol_mg_100g?: number | null; // mg
  salt_100g?: number | null; // g
  calcium_mg_100g?: number | null; // mg
  water_100g?: number | null; // g
  phe_mg_100g?: number | null; // mg

  servingPresets?: ServingPreset[];
};

export type Category = { id: number; name: string };

type RawPreset = {
  path?: unknown;
  g?: unknown;
  label?: unknown;
  grams?: unknown;
  unit?: unknown;
  inflect?: { one?: unknown; few?: unknown; many?: unknown } | null;
};

function normalizePreset(p: unknown): ServingPreset {
  const obj = (p ?? {}) as RawPreset;
  const inf = obj.inflect ?? null;

  return {
    label: String((obj.path ?? obj.label ?? "") as string),
    grams: Number((obj.g ?? obj.grams ?? 0) as number) || 0,
    unit: typeof obj.unit === "string" ? obj.unit : "ks",
    inflect:
      inf && typeof inf === "object"
        ? {
            one: typeof inf.one === "string" ? inf.one : "",
            few: typeof inf.few === "string" ? inf.few : "",
            many: typeof inf.many === "string" ? inf.many : "",
          }
        : undefined,
  };
}

/* ---------------- Helpers ---------------- */
const toNullOrNumber = (v: unknown): number | null => {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const isMissingOrNonPositive = (v: unknown) => {
  if (v === "" || v == null) return true;
  const n = Number(v);
  return !Number.isFinite(n) || n <= 0;
};


const normalizeIngredient = (raw: unknown): Ingredient => {
  type RawIngredient = {
    id?: unknown;
    name?: unknown;
    name_cs?: unknown;
    name_genitive?: unknown;
    category_id?: unknown;
    unit_name?: unknown;
    default_grams?: unknown;
    calories_per_gram?: unknown;
    off_id?: unknown;

    energy_kcal_100g?: unknown;
    proteins_100g?: unknown;
    carbs_100g?: unknown;
    sugars_100g?: unknown;
    fat_100g?: unknown;
    saturated_fat_100g?: unknown;
    fiber_100g?: unknown;
    sodium_100g?: unknown;

    trans_fat_100g?: unknown;
    mono_fat_100g?: unknown;
    poly_fat_100g?: unknown;
    cholesterol_mg_100g?: unknown;
    salt_100g?: unknown;
    calcium_mg_100g?: unknown;
    water_100g?: unknown;
    phe_mg_100g?: unknown;

    serving_presets?: unknown;   // DB shape
    servingPresets?: unknown;    // případně už camelCase
  };

  const r = (raw ?? {}) as RawIngredient;

  const rawPresetsArray: unknown[] =
    Array.isArray(r.serving_presets)
      ? r.serving_presets as unknown[]
      : Array.isArray(r.servingPresets)
      ? r.servingPresets as unknown[]
      : [];

  const presets: ServingPreset[] = rawPresetsArray.map(normalizePreset);

  return {
    id: Number(r.id),
    name: String(r.name ?? ""),
    name_cs: r.name_cs == null ? null : String(r.name_cs),
    name_genitive: r.name_genitive == null ? null : String(r.name_genitive),
    category_id: r.category_id == null ? null : Number(r.category_id),
    unit_name: r.unit_name == null ? null : String(r.unit_name),
    default_grams: r.default_grams == null ? null : Number(r.default_grams),
    calories_per_gram: r.calories_per_gram == null ? null : Number(r.calories_per_gram),
    off_id: r.off_id == null ? null : String(r.off_id),

    energy_kcal_100g: r.energy_kcal_100g == null ? null : Number(r.energy_kcal_100g),
    proteins_100g: r.proteins_100g == null ? null : Number(r.proteins_100g),
    carbs_100g: r.carbs_100g == null ? null : Number(r.carbs_100g),
    sugars_100g: r.sugars_100g == null ? null : Number(r.sugars_100g),
    fat_100g: r.fat_100g == null ? null : Number(r.fat_100g),
    saturated_fat_100g: r.saturated_fat_100g == null ? null : Number(r.saturated_fat_100g),
    fiber_100g: r.fiber_100g == null ? null : Number(r.fiber_100g),
    sodium_100g: r.sodium_100g == null ? null : Number(r.sodium_100g),

    trans_fat_100g: r.trans_fat_100g == null ? null : Number(r.trans_fat_100g),
    mono_fat_100g: r.mono_fat_100g == null ? null : Number(r.mono_fat_100g),
    poly_fat_100g: r.poly_fat_100g == null ? null : Number(r.poly_fat_100g),
    cholesterol_mg_100g: r.cholesterol_mg_100g == null ? null : Number(r.cholesterol_mg_100g),
    salt_100g: r.salt_100g == null ? null : Number(r.salt_100g),
    calcium_mg_100g: r.calcium_mg_100g == null ? null : Number(r.calcium_mg_100g),
    water_100g: r.water_100g == null ? null : Number(r.water_100g),
    phe_mg_100g: r.phe_mg_100g == null ? null : Number(r.phe_mg_100g),

    servingPresets: presets,
  };
};

export default function IngredientAdminPage() {
  const { isAdmin, loading } = useAdmin();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [edited, setEdited] = useState<Record<number, Partial<Ingredient>>>({});

  // --- NOVĚ: kompletní formulář pro novou surovinu ---
  type NewIngredientForm = {
    name: string;
    name_cs: string;
    name_genitive: string;
    category_id: string;
    unit_name: string;
    off_id: string;

    // povinné naší logikou
    default_grams: string;

    // kcal/g (odvozené z energy_kcal_100g/100, ale necháme i ručně zadat)
    calories_per_gram: string;

    // výživové hodnoty na 100 g
    energy_kcal_100g: string;
    proteins_100g: string;
    carbs_100g: string;
    sugars_100g: string;
    fat_100g: string;
    saturated_fat_100g: string;
    fiber_100g: string;
    sodium_100g: string;
    trans_fat_100g: string;
    mono_fat_100g: string;
    poly_fat_100g: string;
    cholesterol_mg_100g: string;
    salt_100g: string;
    calcium_mg_100g: string;
    water_100g: string;
    phe_mg_100g: string;
  };

  const initialNew: NewIngredientForm = {
    name: "",
    name_cs: "",
    name_genitive: "",
    category_id: "",
    unit_name: "",
    off_id: "",

    default_grams: "",
    calories_per_gram: "",

    energy_kcal_100g: "",
    proteins_100g: "",
    carbs_100g: "",
    sugars_100g: "",
    fat_100g: "",
    saturated_fat_100g: "",
    fiber_100g: "",
    sodium_100g: "",
    trans_fat_100g: "",
    mono_fat_100g: "",
    poly_fat_100g: "",
    cholesterol_mg_100g: "",
    salt_100g: "",
    calcium_mg_100g: "",
    water_100g: "",
    phe_mg_100g: "",
  };

  const [newIngredient, setNewIngredient] = useState<NewIngredientForm>(initialNew);

  // --- NOVĚ: presety porcí pro novou surovinu ---
  const [newPresets, setNewPresets] = useState<ServingPreset[]>([]);

  /* ---- Načti kategorie ---- */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/ingredients/categories`);
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          console.error("GET /api/ingredients/categories FAIL", res.status, txt);
          throw new Error("Nepodařilo se načíst kategorie");
        }
        setCategories((await res.json()) as Category[]);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  /* ---- editace buněk + autokalkulace kcal ---- */
  const handleInputChange = (id: number, field: keyof Ingredient, value: string | number) => {
    setEdited((prev) => {
      const row = { ...(prev[id] ?? {}) } as Partial<Ingredient>;
      (row as Record<string, unknown>)[field] = value;

      if (field === "energy_kcal_100g") {
        const kcal100 = Number(value);
        if (Number.isFinite(kcal100)) row.calories_per_gram = Number((kcal100 / 100).toFixed(4));
      } else if (field === "calories_per_gram") {
        const kcalG = Number(value);
        if (Number.isFinite(kcalG)) {
          const current = prev[id] ?? {};
          const currentKcal100 = current.energy_kcal_100g ?? ingredients.find((i) => i.id === id)?.energy_kcal_100g ?? null;
          if (currentKcal100 == null || Number(currentKcal100) === 0) row.energy_kcal_100g = Number((kcalG * 100).toFixed(2));
        }
      }
      return { ...prev, [id]: row };
    });
  };

  /* ---- editor presetů: add/remove/update ---- */
  const addPreset = (id: number) => {
    setEdited((prev) => {
      const row = { ...(prev[id] ?? {}) } as Partial<Ingredient>;
      const base = row.servingPresets ?? ingredients.find((i) => i.id === id)?.servingPresets ?? [];
      row.servingPresets = [...base, { label: "", grams: 0, unit: "ks", inflect: { one: "", few: "", many: "" } }];
      return { ...prev, [id]: row };
    });
  };

  const updatePreset = (id: number, index: number, patch: Partial<ServingPreset>) => {
    setEdited((prev) => {
      const row = { ...(prev[id] ?? {}) } as Partial<Ingredient>;
      const base = row.servingPresets ?? ingredients.find((i) => i.id === id)?.servingPresets ?? [];
      const next = base.map((p, i) => (i === index ? { ...p, ...patch, grams: Number(patch.grams ?? p.grams) } : p));
      row.servingPresets = next;
      return { ...prev, [id]: row };
    });
  };

  const removePreset = (id: number, index: number) => {
    setEdited((prev) => {
      const row = { ...(prev[id] ?? {}) } as Partial<Ingredient>;
      const base = row.servingPresets ?? ingredients.find((i) => i.id === id)?.servingPresets ?? [];
      row.servingPresets = base.filter((_, i) => i !== index);
      return { ...prev, [id]: row };
    });
  };
  // --- NOVÉ: práce s presety u NOVÉ suroviny (bez id) ---
  const addNewPreset = () => {
    setNewPresets((prev) => [...prev, { label: "", grams: 0, unit: "ks", inflect: { one: "", few: "", many: "" } }]);
  };

  const updateNewPreset = (index: number, patch: Partial<ServingPreset>) => {
    setNewPresets((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch, grams: Number(patch.grams ?? p.grams) } : p)));
  };

  const removeNewPreset = (index: number) => {
    setNewPresets((prev) => prev.filter((_, i) => i !== index));
  };

  /* ---- Uložit řádek ---- */
  const handleSave = async (id: number) => {
    const current = ingredients.find((i) => i.id === id);
    if (!current) return alert("Surovina nenalezena.");

    const e = edited[id] || {};

    // *** Validace: default_grams je povinné a > 0 ***
    const defaultGramsCandidate = e.default_grams ?? current.default_grams;
    if (isMissingOrNonPositive(defaultGramsCandidate)) {
      alert("Vyplň prosím 'g/ks' (povinné, musí být > 0).");
      return;
    }

    const payload = {
      id: current.id,
      name: (e.name ?? current.name) as string,
      name_cs: (e.name_cs ?? current.name_cs ?? null) as string | null,
      name_genitive: (e.name_genitive ?? current.name_genitive ?? null) as string | null,
      off_id: (e.off_id ?? current.off_id ?? null) as string | null,
      unit_name: (e.unit_name ?? current.unit_name ?? null) as string | null,

      category_id: Number(e.category_id ?? current.category_id ?? 0) || null,
      default_grams: toNullOrNumber(e.default_grams ?? current.default_grams),
      calories_per_gram: toNullOrNumber(e.calories_per_gram ?? current.calories_per_gram),

      energy_kcal_100g: toNullOrNumber(e.energy_kcal_100g ?? current.energy_kcal_100g),
      proteins_100g: toNullOrNumber(e.proteins_100g ?? current.proteins_100g),
      carbs_100g: toNullOrNumber(e.carbs_100g ?? current.carbs_100g),
      sugars_100g: toNullOrNumber(e.sugars_100g ?? current.sugars_100g),
      fat_100g: toNullOrNumber(e.fat_100g ?? current.fat_100g),
      saturated_fat_100g: toNullOrNumber(e.saturated_fat_100g ?? current.saturated_fat_100g),
      fiber_100g: toNullOrNumber(e.fiber_100g ?? current.fiber_100g),
      sodium_100g: toNullOrNumber(e.sodium_100g ?? current.sodium_100g),

      trans_fat_100g: toNullOrNumber(e.trans_fat_100g ?? current.trans_fat_100g ?? null),
      mono_fat_100g: toNullOrNumber(e.mono_fat_100g ?? current.mono_fat_100g ?? null),
      poly_fat_100g: toNullOrNumber(e.poly_fat_100g ?? current.poly_fat_100g ?? null),
      cholesterol_mg_100g: toNullOrNumber(e.cholesterol_mg_100g ?? current.cholesterol_mg_100g ?? null),
      salt_100g: toNullOrNumber(e.salt_100g ?? current.salt_100g ?? null),
      calcium_mg_100g: toNullOrNumber(e.calcium_mg_100g ?? current.calcium_mg_100g ?? null),
      water_100g: toNullOrNumber(e.water_100g ?? current.water_100g ?? null),
      phe_mg_100g: toNullOrNumber(e.phe_mg_100g ?? current.phe_mg_100g ?? null),

      serving_presets: (e.servingPresets ?? current.servingPresets ?? []).map((p) => ({
        label: String(p.label ?? ""),
        grams: Number(p.grams ?? 0),
        unit: p.unit ?? "ks",
        inflect: p.inflect && (p.inflect.one || p.inflect.few || p.inflect.many) ? { one: p.inflect.one, few: p.inflect.few, many: p.inflect.many } : undefined,
      })),
    };

    if (payload.category_id == null) return alert("Kategorie je povinná.");

    try {
      const token = localStorage.getItem("token") ?? "";
      const res = await fetch(`${API_URL}/api/ingredients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        alert(`Uložení selhalo: ${err.error || `HTTP ${res.status}`}`);
        return;
      }

      const updated: Ingredient = {
        ...current,
        ...(e as Partial<Ingredient>),
        servingPresets: payload.serving_presets,
        trans_fat_100g: payload.trans_fat_100g,
        mono_fat_100g: payload.mono_fat_100g,
        poly_fat_100g: payload.poly_fat_100g,
        cholesterol_mg_100g: payload.cholesterol_mg_100g,
        salt_100g: payload.salt_100g,
        calcium_mg_100g: payload.calcium_mg_100g,
        water_100g: payload.water_100g,
        phe_mg_100g: payload.phe_mg_100g,
      };

      setIngredients((prev) => prev.map((ing) => (ing.id === id ? updated : ing)));
      setEdited((prev) => {
        const c = { ...prev };
        delete c[id];
        return c;
      });
    } catch (err) {
      console.error(err);
      alert("Chyba při komunikaci se serverem.");
    }
  };

  /* ---- Smazat ---- */
  const handleDelete = async (id: number) => {
    if (!confirm("Opravdu smazat surovinu?")) return;
    try {
      const token = localStorage.getItem("token") ?? "";
      const res = await fetch(`${API_URL}/api/ingredients/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return alert("Smazání selhalo.");
      setIngredients((prev) => prev.filter((i) => i.id !== id));
      setEdited((prev) => {
        const c = { ...prev };
        delete c[id];
        return c;
      });
    } catch (e) {
      console.error(e);
      alert("Chyba při komunikaci se serverem.");
    }
  };

  /* ---- Vytvořit novou ---- */
  const handleNewChange = (field: keyof typeof newIngredient, value: string) => setNewIngredient((p) => ({ ...p, [field]: value }));

  const handleCreate = async () => {
    const n = newIngredient;
    if (!n.name || !n.category_id) return alert("Vyplň název a kategorii.");
    if (isMissingOrNonPositive(n.default_grams)) return alert("Vyplň prosím 'g/ks' u nové suroviny (povinné, > 0).");

    // Připrav payload se všemi poli + presety
    const payload = {
      name: n.name,
      name_cs: n.name_cs || null,
      name_genitive: n.name_genitive || null,
      off_id: n.off_id || null,
      unit_name: n.unit_name || null,

      category_id: Number(n.category_id) || null,
      default_grams: toNullOrNumber(n.default_grams),
      calories_per_gram: toNullOrNumber(n.calories_per_gram),

      energy_kcal_100g: toNullOrNumber(n.energy_kcal_100g),
      proteins_100g: toNullOrNumber(n.proteins_100g),
      carbs_100g: toNullOrNumber(n.carbs_100g),
      sugars_100g: toNullOrNumber(n.sugars_100g),
      fat_100g: toNullOrNumber(n.fat_100g),
      saturated_fat_100g: toNullOrNumber(n.saturated_fat_100g),
      fiber_100g: toNullOrNumber(n.fiber_100g),
      sodium_100g: toNullOrNumber(n.sodium_100g),

      trans_fat_100g: toNullOrNumber(n.trans_fat_100g),
      mono_fat_100g: toNullOrNumber(n.mono_fat_100g),
      poly_fat_100g: toNullOrNumber(n.poly_fat_100g),
      cholesterol_mg_100g: toNullOrNumber(n.cholesterol_mg_100g),
      salt_100g: toNullOrNumber(n.salt_100g),
      calcium_mg_100g: toNullOrNumber(n.calcium_mg_100g),
      water_100g: toNullOrNumber(n.water_100g),
      phe_mg_100g: toNullOrNumber(n.phe_mg_100g),

      serving_presets: newPresets.map((p) => ({
        label: String(p.label ?? ""),
        grams: Number(p.grams ?? 0),
        unit: p.unit ?? "ks",
        inflect: p.inflect && (p.inflect.one || p.inflect.few || p.inflect.many) ? { one: p.inflect.one, few: p.inflect.few, many: p.inflect.many } : undefined,
      })),
    };

    if (payload.category_id == null) return alert("Kategorie je povinná.");

    try {
      const token = localStorage.getItem("token") ?? "";
      const res = await fetch(`${API_URL}/api/ingredients`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        alert(`Vytvoření selhalo: ${err.error || `HTTP ${res.status}`}`);
        return;
      }

      const createdRaw = await res.json();
      const created = normalizeIngredient(createdRaw);

      setIngredients((prev) => [...prev, created]);
      setNewIngredient(initialNew);
      setNewPresets([]);
    } catch (e) {
      console.error(e);
      alert("Chyba při komunikaci se serverem.");
    }
  };
  /* ---- Hledání s debounce ---- */
  useEffect(() => {
    const controller = new AbortController();
    const t = setTimeout(async () => {
      if (!search.trim()) {
        setIngredients([]);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/api/ingredients/search?q=${encodeURIComponent(search)}&limit=50&format=full`, { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          const normalized = Array.isArray(data) ? data.map(normalizeIngredient) : [];
          setIngredients(normalized);
        }
      } catch (e) {
        if (!(e instanceof DOMException && e.name === "AbortError")) console.error(e);
      }
    }, 300);
    return () => {
      controller.abort();
      clearTimeout(t);
    };
  }, [search]);

  const filtered = ingredients;

  return (
    <div className="bg-gray-50 min-h-screen">
      {loading ? (
        <p className="text-center p-10">Načítání oprávnění...</p>
      ) : !isAdmin ? (
        <p className="text-center p-10 text-red-600 font-semibold">Nemáš oprávnění pro přístup k této stránce.</p>
      ) : (
        <main className="p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-800">Správa surovin</h1>
            <p className="text-lg text-gray-500 mt-2">Uprav jednotky, makra a předvolby porcí.</p>
          </div>
          {/* Přidání + Hledání */}
          <div className="bg-white p-6 rounded-2xl shadow-lg mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Přidat novou surovinu</h2>

            {/* --- Základní údaje --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-4 items-end">
              <input
                className="p-3 border rounded-lg md:col-span-2"
                placeholder="Název (EN)"
                value={newIngredient.name}
                onChange={(e) => handleNewChange("name", e.target.value)}
              />
              <input
                className="p-3 border rounded-lg md:col-span-2"
                placeholder="Název (CS)"
                value={newIngredient.name_cs}
                onChange={(e) => handleNewChange("name_cs", e.target.value)}
              />
              <input
                className="p-3 border rounded-lg md:col-span-2"
                placeholder="Genitiv (koho/čeho) – např. česneku"
                value={newIngredient.name_genitive}
                onChange={(e) => handleNewChange("name_genitive", e.target.value)}
              />

              <select className="p-3 border rounded-lg" value={newIngredient.category_id} onChange={(e) => handleNewChange("category_id", e.target.value)}>
                <option value="">Kategorie…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                className="p-3 border rounded-lg"
                value={newIngredient.unit_name}
                onChange={(e) => handleNewChange("unit_name", e.target.value)}
                title="Jednotka suroviny"
              >
                <option value="">Jednotka…</option>
                {UNIT_OPTIONS.map((u: UnitOption) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>

              <input
                className={`p-3 border rounded-lg ${isMissingOrNonPositive(newIngredient.default_grams) ? "border-red-500" : ""}`}
                placeholder="g/ks (POVINNÉ)"
                type="number"
                value={newIngredient.default_grams}
                onChange={(e) => handleNewChange("default_grams", e.target.value)}
              />

              <input
                className="p-3 border rounded-lg"
                placeholder="kcal/g"
                type="number"
                value={newIngredient.calories_per_gram}
                onChange={(e) => handleNewChange("calories_per_gram", e.target.value)}
                title="Volitelné, dopočítá se z kcal/100g"
              />

              <input
                className="p-3 border rounded-lg"
                placeholder="OFF ID (volitelné)"
                value={newIngredient.off_id}
                onChange={(e) => handleNewChange("off_id", e.target.value)}
              />

              <button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-4 py-3 md:col-span-2">
                ➕ Přidat
              </button>
            </div>

            {/* --- Výživa na 100 g --- */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-8 gap-4">
              <NumberCell label="kcal/100g" value={newIngredient.energy_kcal_100g} onChange={(v) => handleNewChange("energy_kcal_100g", v)} />
              <NumberCell label="bílkoviny (g)" value={newIngredient.proteins_100g} onChange={(v) => handleNewChange("proteins_100g", v)} />
              <NumberCell label="sacharidy (g)" value={newIngredient.carbs_100g} onChange={(v) => handleNewChange("carbs_100g", v)} />
              <NumberCell label="cukry (g)" value={newIngredient.sugars_100g} onChange={(v) => handleNewChange("sugars_100g", v)} />
              <NumberCell label="tuky (g)" value={newIngredient.fat_100g} onChange={(v) => handleNewChange("fat_100g", v)} />
              <NumberCell label="nasycené (g)" value={newIngredient.saturated_fat_100g} onChange={(v) => handleNewChange("saturated_fat_100g", v)} />
              <NumberCell label="vláknina (g)" value={newIngredient.fiber_100g} onChange={(v) => handleNewChange("fiber_100g", v)} />
              <NumberCell label="sodík (g)" value={newIngredient.sodium_100g} onChange={(v) => handleNewChange("sodium_100g", v)} />

              <NumberCell label="trans (g)" value={newIngredient.trans_fat_100g} onChange={(v) => handleNewChange("trans_fat_100g", v)} />
              <NumberCell label="mono (g)" value={newIngredient.mono_fat_100g} onChange={(v) => handleNewChange("mono_fat_100g", v)} />
              <NumberCell label="poly (g)" value={newIngredient.poly_fat_100g} onChange={(v) => handleNewChange("poly_fat_100g", v)} />
              <NumberCell label="cholesterol (mg)" value={newIngredient.cholesterol_mg_100g} onChange={(v) => handleNewChange("cholesterol_mg_100g", v)} />
              <NumberCell label="sůl (g)" value={newIngredient.salt_100g} onChange={(v) => handleNewChange("salt_100g", v)} />
              <NumberCell label="vápník (mg)" value={newIngredient.calcium_mg_100g} onChange={(v) => handleNewChange("calcium_mg_100g", v)} />
              <NumberCell label="voda (g)" value={newIngredient.water_100g} onChange={(v) => handleNewChange("water_100g", v)} />
              <NumberCell label="PHE (mg)" value={newIngredient.phe_mg_100g} onChange={(v) => handleNewChange("phe_mg_100g", v)} />
            </div>

            {/* --- Předvolby porcí pro NOVOU surovinu --- */}
            <div className="mt-6 rounded-lg border p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold">Předvolby porcí (nová surovina)</div>
                <button type="button" onClick={addNewPreset} className="text-sm px-3 py-1.5 rounded bg-green-600 text-white hover:bg-green-700">
                  + přidat
                </button>
              </div>

              {newPresets.length === 0 && (
                <div className="text-sm text-gray-500">Zatím žádné položky. Přidej např. „stroužek (3 g)“, „plátek (20 g)“, „porce (50 g)“.</div>
              )}

              <div className="space-y-2">
                {newPresets.map((p, i) => (
                  <div key={i} className="space-y-2 p-2 rounded border">
                    <div className="grid grid-cols-12 gap-2">
                      <input
                        className="col-span-6 p-2 border rounded"
                        placeholder="název (stroužek / plátek / porce …)"
                        value={p.label}
                        onChange={(e) => updateNewPreset(i, { label: e.target.value })}
                      />
                      <div className="col-span-4 flex">
                        <input
                          type="number"
                          step="0.1"
                          className="w-full p-2 border rounded-l text-right"
                          placeholder="gramů"
                          value={Number.isFinite(p.grams) ? p.grams : 0}
                          onChange={(e) => updateNewPreset(i, { grams: Number(e.target.value) })}
                        />
                        <span className="inline-flex items-center px-3 rounded-r border border-l-0 bg-gray-50 text-gray-600">g</span>
                      </div>
                      <select
                        className="col-span-2 p-2 border rounded"
                        value={p.unit ?? "ks"}
                        onChange={(e) => updateNewPreset(i, { unit: e.target.value })}
                        title="Jednotka porce (výchozí ks)"
                      >
                        <option value="ks">ks</option>
                        <option value="g">g</option>
                        <option value="ml">ml</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-12 gap-2">
                      <input
                        className="col-span-4 p-2 border rounded"
                        placeholder="1× (one) např. stroužek"
                        value={p.inflect?.one ?? ""}
                        onChange={(e) => updateNewPreset(i, { inflect: { ...(p.inflect ?? {}), one: e.target.value } })}
                      />
                      <input
                        className="col-span-4 p-2 border rounded"
                        placeholder="2–4× (few) např. stroužky"
                        value={p.inflect?.few ?? ""}
                        onChange={(e) => updateNewPreset(i, { inflect: { ...(p.inflect ?? {}), few: e.target.value } })}
                      />
                      <div className="col-span-3">
                        <input
                          className="w-full p-2 border rounded"
                          placeholder="5+× (many) např. stroužků"
                          value={p.inflect?.many ?? ""}
                          onChange={(e) => updateNewPreset(i, { inflect: { ...(p.inflect ?? {}), many: e.target.value } })}
                        />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button type="button" onClick={() => removeNewPreset(i)} className="px-3 py-2 rounded border text-red-600 hover:bg-red-50">
                          Odebrat
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* --- Hledání --- */}
            <div className="mt-6 border-t pt-6">
              <input
                type="text"
                placeholder="Hledat (CZ/EN)…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full p-3 border rounded-lg"
              />
            </div>
          </div>
          {/* Seznam surovin */}
          <div className="space-y-3">
            {filtered.map((ing) => {
              const e = edited[ing.id] || {};
              const presets = e.servingPresets ?? ing.servingPresets ?? [];
              const defaultGramsMissing = isMissingOrNonPositive(e.default_grams ?? ing.default_grams);

              return (
                <div key={ing.id} className="bg-white p-4 rounded-xl shadow-sm">
                  {/* Hlavní řádek */}
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-1 text-xs text-gray-500">#{ing.id}</div>

                    <input
                      className="col-span-3 p-2 border rounded"
                      value={e.name ?? ing.name ?? ""}
                      onChange={(ev) => handleInputChange(ing.id, "name", ev.target.value)}
                      placeholder="Název (EN)"
                    />
                    <input
                      className="col-span-3 p-2 border rounded"
                      value={e.name_cs ?? ing.name_cs ?? ""}
                      onChange={(ev) => handleInputChange(ing.id, "name_cs", ev.target.value)}
                      placeholder="Název (CS)"
                    />
                    <input
                      className="col-span-3 p-2 border rounded"
                      value={e.name_genitive ?? ing.name_genitive ?? ""}
                      onChange={(ev) => handleInputChange(ing.id, "name_genitive", ev.target.value)}
                      placeholder="Genitiv (koho/čeho) – např. česneku"
                    />
                    <select
                      className="col-span-2 p-2 border rounded"
                      value={e.category_id ?? ing.category_id ?? ""}
                      onChange={(ev) => handleInputChange(ing.id, "category_id", ev.target.value)}
                    >
                      <option value="">Kategorie</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>

                    {/* unit_name = textová jednotka (g/ml/ks) */}
                    <select
                      className="col-span-1 p-2 border rounded"
                      value={e.unit_name ?? ing.unit_name ?? ""}
                      onChange={(ev) => handleInputChange(ing.id, "unit_name", ev.target.value)}
                      title="Jednotka suroviny"
                    >
                      <option value="">—</option>
                      {UNIT_OPTIONS.map((u: UnitOption) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                    <div className="col-span-2 flex justify-end gap-2">
                      <button onClick={() => handleSave(ing.id)} className="bg-green-600 hover:bg-green-700 text-white p-2 rounded" title="Uložit">
                        <IconSave />
                      </button>
                      <button onClick={() => handleDelete(ing.id)} className="bg-red-600 hover:bg-red-700 text-white p-2 rounded" title="Smazat">
                        <IconTrash />
                      </button>
                    </div>
                  </div>
                  {/* Makro hodnoty (na 100 g) */}
                  <div className="mt-2 grid grid-cols-12 gap-2 text-xs">
                    <NumberCell
                      label="kcal/100g"
                      value={e.energy_kcal_100g ?? ing.energy_kcal_100g}
                      onChange={(v: string) => handleInputChange(ing.id, "energy_kcal_100g", v)}
                    />

                    {/* *** g/ks (POVINNÉ) *** */}
                    <NumberCell
                      label="g/ks (POVINNÉ)"
                      value={e.default_grams ?? ing.default_grams}
                      onChange={(v: string) => handleInputChange(ing.id, "default_grams", v)}
                      required
                      invalid={defaultGramsMissing}
                    />

                    <NumberCell
                      label="bílkoviny (g)"
                      value={e.proteins_100g ?? ing.proteins_100g}
                      onChange={(v: string) => handleInputChange(ing.id, "proteins_100g", v)}
                    />
                    <NumberCell
                      label="sacharidy (g)"
                      value={e.carbs_100g ?? ing.carbs_100g}
                      onChange={(v: string) => handleInputChange(ing.id, "carbs_100g", v)}
                    />
                    <NumberCell
                      label="cukry (g)"
                      value={e.sugars_100g ?? ing.sugars_100g}
                      onChange={(v: string) => handleInputChange(ing.id, "sugars_100g", v)}
                    />
                    <NumberCell label="tuky (g)" value={e.fat_100g ?? ing.fat_100g} onChange={(v: string) => handleInputChange(ing.id, "fat_100g", v)} />
                    <NumberCell
                      label="nasycené (g)"
                      value={e.saturated_fat_100g ?? ing.saturated_fat_100g}
                      onChange={(v: string) => handleInputChange(ing.id, "saturated_fat_100g", v)}
                    />
                    <NumberCell
                      label="vláknina (g)"
                      value={e.fiber_100g ?? ing.fiber_100g}
                      onChange={(v: string) => handleInputChange(ing.id, "fiber_100g", v)}
                    />
                    <NumberCell
                      label="sodík (g)"
                      value={e.sodium_100g ?? ing.sodium_100g}
                      onChange={(v: string) => handleInputChange(ing.id, "sodium_100g", v)}
                    />

                    {/* NOVÉ */}
                    <NumberCell
                      label="trans (g)"
                      value={e.trans_fat_100g ?? ing.trans_fat_100g ?? ""}
                      onChange={(v: string) => handleInputChange(ing.id, "trans_fat_100g", v)}
                    />
                    <NumberCell
                      label="mono (g)"
                      value={e.mono_fat_100g ?? ing.mono_fat_100g ?? ""}
                      onChange={(v: string) => handleInputChange(ing.id, "mono_fat_100g", v)}
                    />
                    <NumberCell
                      label="poly (g)"
                      value={e.poly_fat_100g ?? ing.poly_fat_100g ?? ""}
                      onChange={(v: string) => handleInputChange(ing.id, "poly_fat_100g", v)}
                    />
                    <NumberCell
                      label="cholesterol (mg)"
                      value={e.cholesterol_mg_100g ?? ing.cholesterol_mg_100g ?? ""}
                      onChange={(v: string) => handleInputChange(ing.id, "cholesterol_mg_100g", v)}
                    />
                    <NumberCell
                      label="sůl (g)"
                      value={e.salt_100g ?? ing.salt_100g ?? ""}
                      onChange={(v: string) => handleInputChange(ing.id, "salt_100g", v)}
                    />
                    <NumberCell
                      label="vápník (mg)"
                      value={e.calcium_mg_100g ?? ing.calcium_mg_100g ?? ""}
                      onChange={(v: string) => handleInputChange(ing.id, "calcium_mg_100g", v)}
                    />
                    <NumberCell
                      label="voda (g)"
                      value={e.water_100g ?? ing.water_100g ?? ""}
                      onChange={(v: string) => handleInputChange(ing.id, "water_100g", v)}
                    />
                    <NumberCell
                      label="PHE (mg)"
                      value={e.phe_mg_100g ?? ing.phe_mg_100g ?? ""}
                      onChange={(v: string) => handleInputChange(ing.id, "phe_mg_100g", v)}
                    />

                    <NumberCell
                      label="kcal/g"
                      value={e.calories_per_gram ?? ing.calories_per_gram}
                      onChange={(v: string) => handleInputChange(ing.id, "calories_per_gram", v)}
                    />
                  </div>
                  {/* Editor PŘEDVOLEB PORCÍ */}
                  <div className="mt-4 rounded-lg border p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold">Předvolby porcí</div>
                      <button
                        type="button"
                        onClick={() => addPreset(ing.id)}
                        className="text-sm px-3 py-1.5 rounded bg-green-600 text-white hover:bg-green-700"
                      >
                        + přidat
                      </button>
                    </div>

                    {presets.length === 0 && (
                      <div className="text-sm text-gray-500">Zatím žádné položky. Přidej např. „stroužek (3 g)“, „plátek (20 g)“, „porce (50 g)“.</div>
                    )}

                    <div className="space-y-2">
                      {presets.map((p, i) => (
                        <div key={i} className="space-y-2 p-2 rounded border">
                          <div className="grid grid-cols-12 gap-2">
                            <input
                              className="col-span-6 p-2 border rounded"
                              placeholder="název (stroužek / plátek / porce …)"
                              value={p.label}
                              onChange={(e) => updatePreset(ing.id, i, { label: e.target.value })}
                            />
                            <div className="col-span-4 flex">
                              <input
                                type="number"
                                step="0.1"
                                className="w-full p-2 border rounded-l text-right"
                                placeholder="gramů"
                                value={Number.isFinite(p.grams) ? p.grams : 0}
                                onChange={(e) => updatePreset(ing.id, i, { grams: Number(e.target.value) })}
                              />
                              <span className="inline-flex items-center px-3 rounded-r border border-l-0 bg-gray-50 text-gray-600">g</span>
                            </div>
                            <select
                              className="col-span-2 p-2 border rounded"
                              value={p.unit ?? "ks"}
                              onChange={(e) => updatePreset(ing.id, i, { unit: e.target.value })}
                              title="Jednotka porce (výchozí ks)"
                            >
                              <option value="ks">ks</option>
                              <option value="g">g</option>
                              <option value="ml">ml</option>
                            </select>
                          </div>

                          {/* skloňování — one / few / many */}
                          <div className="grid grid-cols-12 gap-2">
                            <input
                              className="col-span-4 p-2 border rounded"
                              placeholder="1× (one) např. stroužek"
                              value={p.inflect?.one ?? ""}
                              onChange={(e) => updatePreset(ing.id, i, { inflect: { ...(p.inflect ?? {}), one: e.target.value } })}
                            />
                            <input
                              className="col-span-4 p-2 border rounded"
                              placeholder="2–4× (few) např. stroužky"
                              value={p.inflect?.few ?? ""}
                              onChange={(e) => updatePreset(ing.id, i, { inflect: { ...(p.inflect ?? {}), few: e.target.value } })}
                            />
                            <div className="col-span-3">
                              <input
                                className="w-full p-2 border rounded"
                                placeholder="5+× (many) např. stroužků"
                                value={p.inflect?.many ?? ""}
                                onChange={(e) => updatePreset(ing.id, i, { inflect: { ...(p.inflect ?? {}), many: e.target.value } })}
                              />
                            </div>
                            <div className="col-span-1 flex justify-end">
                              <button type="button" onClick={() => removePreset(ing.id, i)} className="px-3 py-2 rounded border text-red-600 hover:bg-red-50">
                                Odebrat
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>{" "}
                  {/* konec panelu presetů */}
                </div> /* konec karty suroviny */
              );
            })}
          </div>{" "}
          {/* konec wrapperu seznamu */}
        </main>
      )}
    </div>
  );
}

/* ------- Mini vstupy ------- */
function NumberCell({
  label,
  value,
  onChange,
  required = false,
  invalid = false,
}: {
  label: string;
  value: number | string | null | undefined;
  onChange: (v: string) => void;
  required?: boolean;
  invalid?: boolean;
}) {
  return (
    <div className="col-span-3 sm:col-span-2 md:col-span-1">
      <div className="text-gray-500">
        {label} {required && <span className="text-red-600">*</span>}
      </div>
      <input
        type="number"
        step="0.0001"
        className={`w-full p-2 border rounded ${invalid ? "border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500" : ""}`}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid || undefined}
        title={invalid ? "Pole je povinné a musí být > 0" : undefined}
      />
    </div>
  );
}
