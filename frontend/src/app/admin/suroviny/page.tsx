"use client";

import { useEffect, useState } from "react";
import useAdmin from "@/hooks/useAdmin";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5050";

// --- Helper Icons (ponecháno) ---
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
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
    <polyline points="17 21 17 13 7 13 7 21"></polyline>
    <polyline points="7 3 7 8 15 8"></polyline>
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
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

export type Ingredient = {
  id: number;
  name: string;
  name_cs: string | null;
  category_id: number | null;
  unit_name: string | null;
  default_grams: number | null;
  calories_per_gram: number | null;
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

export type Category = { id: number; name: string };

const toNullOrNumber = (v: unknown): number | null => {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export default function IngredientAdminPage() {
  const { isAdmin, loading } = useAdmin();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [edited, setEdited] = useState<Record<number, Partial<Ingredient>>>({});

  // pro přidání nové suroviny (neřeší makra – můžeš si doplnit)
  const [newIngredient, setNewIngredient] = useState({
    name: "",
    calories_per_gram: "",
    category_id: "",
    default_grams: "",
    unit_name: "",
  });

  useEffect(() => {
    async function fetchCategories() {
      try {
        const catRes = await fetch(`${API_URL}/api/ingredients/categories`);
        if (!catRes.ok) throw new Error("Nepodařilo se načíst kategorie");
        const cat = (await catRes.json()) as Category[];
        setCategories(cat);
      } catch (err) {
        console.error(err);
      }
    }
    fetchCategories();
  }, []);

  /** Chytré upravení řádku – umí autokalkulace kcal/100g <-> kcal/g */
  const handleInputChange = (id: number, field: keyof Ingredient, value: string | number) => {
    setEdited((prev) => {
      const row = { ...(prev[id] ?? {}) } as Partial<Ingredient>;

      // zapsat primární změnu
      (row as Record<string, unknown>)[field] = value;

      // autokalkulace
      if (field === "energy_kcal_100g") {
        const kcal100 = Number(value);
        if (Number.isFinite(kcal100)) {
          // nastav/aktualizuj i kcal/g
          row.calories_per_gram = Number((kcal100 / 100).toFixed(4));
        }
      } else if (field === "calories_per_gram") {
        const kcalG = Number(value);
        if (Number.isFinite(kcalG)) {
          // pokud chybí/není vyplněno kcal/100g, dopočti
          const current = prev[id] ?? {};
          const currentKcal100 = current.energy_kcal_100g ?? ingredients.find((i) => i.id === id)?.energy_kcal_100g ?? null;
          if (currentKcal100 == null || Number(currentKcal100) === 0) {
            row.energy_kcal_100g = Number((kcalG * 100).toFixed(2));
          }
        }
      }

      return { ...prev, [id]: row };
    });
  };

  const handleSave = async (id: number) => {
    const current = ingredients.find((i) => i.id === id);
    if (!current) {
      alert("Surovina nenalezena.");
      return;
    }
    const e = edited[id] || {};

    const payload: Ingredient = {
      id: current.id,
      // texty
      name: (e.name ?? current.name) as string,
      name_cs: (e.name_cs ?? current.name_cs ?? null) as string | null,
      off_id: (e.off_id ?? current.off_id ?? null) as string | null,
      unit_name: (e.unit_name ?? current.unit_name ?? null) as string | null,

      // čísla
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
    };

    if (payload.category_id == null) {
      alert("Kategorie je povinná.");
      return;
    }

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

      // optimistický update
      setIngredients((prev) => prev.map((ing) => (ing.id === id ? payload : ing)));
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

  const handleDelete = async (id: number) => {
    if (!confirm("Opravdu smazat surovinu?")) return;
    try {
      const token = localStorage.getItem("token") ?? "";
      const res = await fetch(`${API_URL}/api/ingredients/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        alert("Smazání selhalo.");
        return;
      }
      setIngredients((prev) => prev.filter((i) => i.id !== id));
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

  const handleNewChange = (field: keyof typeof newIngredient, value: string) => {
    setNewIngredient((p) => ({ ...p, [field]: value }));
  };

  const handleCreate = async () => {
    const { name, calories_per_gram, category_id, default_grams, unit_name } = newIngredient;
    if (!name || !category_id) {
      alert("Vyplň název a kategorii.");
      return;
    }
    try {
      const token = localStorage.getItem("token") ?? "";
      const res = await fetch(`${API_URL}/api/ingredients`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name,
          category_id: Number(category_id),
          calories_per_gram: calories_per_gram ? Number(calories_per_gram) : null,
          default_grams: default_grams ? Number(default_grams) : null,
          unit_name: unit_name || null,
        }),
      });
      if (!res.ok) {
        alert("Vytvoření selhalo.");
        return;
      }
      const created = (await res.json()) as Ingredient;
      setIngredients((prev) => [...prev, created]);
      setNewIngredient({ name: "", calories_per_gram: "", category_id: "", default_grams: "", unit_name: "" });
    } catch (err) {
      console.error(err);
      alert("Chyba při komunikaci se serverem.");
    }
  };
  // vyhledávání s debounce
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      if (!search.trim()) {
        setIngredients([]);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/api/ingredients/search?q=${encodeURIComponent(search)}&limit=50&format=full`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = (await res.json()) as Ingredient[];
          setIngredients(data);
        }
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          console.error(err);
        }
      }
    }, 300); // čeká 300 ms po psaní

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [search]);
  const filtered = ingredients; // server nám vrací už jen odpovídající výsledky

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
            <p className="text-lg text-gray-500 mt-2">Prohlížej a upravuj názvy, překlady i makra.</p>
          </div>

          {/* Přidání + Hledání */}
          <div className="bg-white p-6 rounded-2xl shadow-lg mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Přidat novou surovinu</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4 items-end">
              <input
                className="p-3 border rounded-lg md:col-span-2"
                placeholder="Název"
                value={newIngredient.name}
                onChange={(e) => handleNewChange("name", e.target.value)}
              />
              <input
                className="p-3 border rounded-lg"
                placeholder="kcal/g"
                type="number"
                value={newIngredient.calories_per_gram}
                onChange={(e) => handleNewChange("calories_per_gram", e.target.value)}
              />
              <select className="p-3 border rounded-lg" value={newIngredient.category_id} onChange={(e) => handleNewChange("category_id", e.target.value)}>
                <option value="">Kategorie…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                className="p-3 border rounded-lg"
                placeholder="g/ks"
                type="number"
                value={newIngredient.default_grams}
                onChange={(e) => handleNewChange("default_grams", e.target.value)}
              />
              <input
                className="p-3 border rounded-lg"
                placeholder="Jednotka (např. g / ml / ks)"
                value={newIngredient.unit_name}
                onChange={(e) => handleNewChange("unit_name", e.target.value)}
              />
              <button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-4 py-3">
                ➕ Přidat
              </button>
            </div>

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

          {/* Seznam surovin (edit) */}
          <div className="space-y-3">
            {filtered.map((ing) => {
              const e = edited[ing.id] || {};
              return (
                <div key={ing.id} className="bg-white p-4 rounded-xl shadow-sm">
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

                    <input
                      className="col-span-1 p-2 border rounded"
                      placeholder="jed."
                      value={e.unit_name ?? ing.unit_name ?? ""}
                      onChange={(ev) => handleInputChange(ing.id, "unit_name", ev.target.value)}
                    />

                    <div className="col-span-2 flex justify-end gap-2">
                      <button onClick={() => handleSave(ing.id)} className="bg-green-600 hover:bg-green-700 text-white p-2 rounded" title="Uložit">
                        <IconSave />
                      </button>
                      <button onClick={() => handleDelete(ing.id)} className="bg-red-600 hover:bg-red-700 text-white p-2 rounded" title="Smazat">
                        <IconTrash />
                      </button>
                    </div>
                  </div>

                  {/* Makra řádek */}
                  <div className="mt-2 grid grid-cols-12 gap-2 text-xs">
                    <NumberCell
                      label="kcal/100g"
                      value={e.energy_kcal_100g ?? ing.energy_kcal_100g}
                      onChange={(v) => handleInputChange(ing.id, "energy_kcal_100g", v)}
                    />
                    <NumberCell
                      label="bílkoviny"
                      value={e.proteins_100g ?? ing.proteins_100g}
                      onChange={(v) => handleInputChange(ing.id, "proteins_100g", v)}
                    />
                    <NumberCell label="sacharidy" value={e.carbs_100g ?? ing.carbs_100g} onChange={(v) => handleInputChange(ing.id, "carbs_100g", v)} />
                    <NumberCell label="cukry" value={e.sugars_100g ?? ing.sugars_100g} onChange={(v) => handleInputChange(ing.id, "sugars_100g", v)} />
                    <NumberCell label="tuky" value={e.fat_100g ?? ing.fat_100g} onChange={(v) => handleInputChange(ing.id, "fat_100g", v)} />
                    <NumberCell
                      label="nasycené"
                      value={e.saturated_fat_100g ?? ing.saturated_fat_100g}
                      onChange={(v) => handleInputChange(ing.id, "saturated_fat_100g", v)}
                    />
                    <NumberCell label="vláknina" value={e.fiber_100g ?? ing.fiber_100g} onChange={(v) => handleInputChange(ing.id, "fiber_100g", v)} />
                    <NumberCell label="sodík" value={e.sodium_100g ?? ing.sodium_100g} onChange={(v) => handleInputChange(ing.id, "sodium_100g", v)} />
                    <NumberCell
                      label="kcal/g"
                      value={e.calories_per_gram ?? ing.calories_per_gram}
                      onChange={(v) => handleInputChange(ing.id, "calories_per_gram", v)}
                    />
                    <NumberCell label="g/ks" value={e.default_grams ?? ing.default_grams} onChange={(v) => handleInputChange(ing.id, "default_grams", v)} />
                    <TextCell label="OFF id" value={e.off_id ?? ing.off_id ?? ""} onChange={(v) => handleInputChange(ing.id, "off_id", v)} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Panel kategorií – případně doplň později */}
        </main>
      )}
    </div>
  );
}

/** Malé pomocné cell komponenty pro čísla / text */
function NumberCell({ label, value, onChange }: { label: string; value: number | string | null | undefined; onChange: (v: string) => void }) {
  return (
    <div className="col-span-3 sm:col-span-2 md:col-span-1">
      <div className="text-gray-500">{label}</div>
      <input type="number" step="0.0001" className="w-full p-2 border rounded" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function TextCell({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="col-span-3 sm:col-span-2 md:col-span-2">
      <div className="text-gray-500">{label}</div>
      <input className="w-full p-2 border rounded" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
