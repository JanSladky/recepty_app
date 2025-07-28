"use client";

import { useEffect, useState } from "react";
import useAdmin from "@/hooks/useAdmin";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type Ingredient = {
  id: number;
  name: string;
  calories_per_gram: number;
  category_id: number;
  default_grams?: number | null; // Povolujeme i null
  unit_name?: string | null;
};

export type Category = {
  id: number;
  name: string;
};

export default function IngredientAdminPage() {
  const { isAdmin, loading } = useAdmin();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [edited, setEdited] = useState<Record<number, Partial<Ingredient>>>({});
  const [newIngredient, setNewIngredient] = useState({
    name: "",
    calories_per_gram: "",
    category_id: "",
    default_grams: "",
    unit_name: "",
  });
  const [newCategory, setNewCategory] = useState("");
  const [editedCategories, setEditedCategories] = useState<Record<number, string>>({});

  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        const res = await fetch(`${API_URL}/api/ingredients`);
        if (!res.ok) throw new Error("Nepodařilo se načíst suroviny");
        const data = await res.json();
        setIngredients(data);
      } catch (error) {
        console.error(error);
      }
    };

    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_URL}/api/ingredients/categories`);
        if (!res.ok) throw new Error("Nepodařilo se načíst kategorie");
        const data = await res.json();
        setCategories(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchIngredients();
    fetchCategories();
  }, []);

  if (loading) return <p>Načítání oprávnění...</p>;
  if (!isAdmin) return <p className="text-red-600 font-semibold">Nemáš oprávnění pro přístup k této stránce.</p>;

  const handleInputChange = (id: number, field: keyof Ingredient, value: string | number) => {
    setEdited((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleSave = async (id: number) => {
    const current = ingredients.find((i) => i.id === id);
    if (!current) {
      alert("Chyba: Surovina nebyla nalezena.");
      return;
    }

    const editedData = edited[id] || {};
    
    // 1. Zkombinujeme původní a upravená data
    const mergedData = { ...current, ...editedData };

    // 2. Pečlivě převedeme hodnoty na správné typy pro backend
    const finalPayload = {
      ...mergedData,
      calories_per_gram: Number(mergedData.calories_per_gram),
      category_id: Number(mergedData.category_id),
      // OPRAVA: Použijeme 'as any' pro potlačení chyby a '== null' pro kontrolu null i undefined
      default_grams: ((mergedData.default_grams as any) === "" || mergedData.default_grams == null) 
        ? null 
        : Number(mergedData.default_grams),
      unit_name: (mergedData.unit_name === "" || mergedData.unit_name == null) ? null : mergedData.unit_name,
    };

    // 3. Klientská validace
    if (!finalPayload.category_id) {
      alert("Chyba: Kategorie je povinný údaj.");
      return;
    }

    console.log("DATA ODESÍLANÁ NA SERVER:", finalPayload);

    try {
      const res = await fetch(`${API_URL}/api/ingredients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalPayload),
      });

      if (res.ok) {
        alert("Surovina úspěšně uložena!");
        // Aktualizujeme stav s finálními, správně otypovanými daty
        setIngredients((prev) =>
          prev.map((ing) => (ing.id === id ? finalPayload : ing))
        );
        setEdited((prev) => {
          const copy = { ...prev };
          delete copy[id];
          return copy;
        });
      } else {
        const errorData = await res.json();
        alert(`Chyba při ukládání: ${errorData.error || "Neznámá chyba serveru."}`);
      }
    } catch (error) {
      console.error("Chyba při komunikaci se serverem:", error);
      alert("Chyba: Nepodařilo se spojit se serverem.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Opravdu chceš smazat surovinu?")) return;
    try {
      const res = await fetch(`${API_URL}/api/ingredients/${id}`, { method: "DELETE" });
      if (res.ok) {
        setIngredients((prev) => prev.filter((i) => i.id !== id));
      } else {
        alert("Smazání se nezdařilo.");
      }
    } catch (error) {
      alert("Chyba při komunikaci se serverem.");
    }
  };

  const handleNewChange = (field: keyof typeof newIngredient, value: string) => {
    setNewIngredient((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreate = async () => {
    const { name, calories_per_gram, category_id, default_grams, unit_name } = newIngredient;
    if (!name || !calories_per_gram || !category_id) {
        alert("Vyplňte prosím název, kalorie a kategorii.");
        return;
    }
    try {
        const res = await fetch(`${API_URL}/api/ingredients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name,
            category_id: Number(category_id),
            calories_per_gram: Number(calories_per_gram),
            default_grams: default_grams ? Number(default_grams) : undefined,
            unit_name: unit_name || undefined,
        }),
        });

        if (res.ok) {
        const created = await res.json();
        setIngredients((prev) => [...prev, created]);
        setNewIngredient({ name: "", calories_per_gram: "", category_id: "", default_grams: "", unit_name: "" });
        } else {
            const errorData = await res.json();
            alert(`Chyba při vytváření: ${errorData.error || "Neznámá chyba"}`);
        }
    } catch(error) {
        alert("Chyba při komunikaci se serverem.");
    }
  };

  const handleCategoryUpdate = async (id: number) => {
    const name = editedCategories[id];
    if (!name) return;
    try {
        const res = await fetch(`${API_URL}/api/ingredients/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
        });
        if (res.ok) {
        setCategories((prev) => prev.map((cat) => (cat.id === id ? { ...cat, name } : cat)));
        const copy = { ...editedCategories };
        delete copy[id];
        setEditedCategories(copy);
        } else {
            alert("Úprava kategorie se nezdařila.");
        }
    } catch(error) {
        alert("Chyba při komunikaci se serverem.");
    }
  };

  const handleCategoryDelete = async (id: number) => {
    if (!confirm("Opravdu chceš smazat tuto kategorii?")) return;
    try {
        const res = await fetch(`${API_URL}/api/ingredients/categories/${id}`, { method: "DELETE" });
        if (res.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
        } else {
            alert("Smazání kategorie se nezdařilo.");
        }
    } catch(error) {
        alert("Chyba při komunikaci se serverem.");
    }
  };

  const handleCategoryCreate = async () => {
    if (!newCategory.trim()) {
        alert("Název kategorie nemůže být prázdný.");
        return;
    }
    try {
        const res = await fetch(`${API_URL}/api/ingredients/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategory }),
        });

        if (res.ok) {
        const created = await res.json();
        setCategories((prev) => [...prev, created]);
        setNewCategory("");
        } else {
            alert("Vytvoření kategorie se nezdařilo.");
        }
    } catch(error) {
        alert("Chyba při komunikaci se serverem.");
    }
  };

  const filtered = ingredients.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <main className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Správa surovin</h1>

      <input
        type="text"
        placeholder="Hledat surovinu..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-2 border rounded mb-4"
      />

      <div className="grid grid-cols-1 sm:grid-cols-6 gap-2 mb-4">
        <input
          type="text"
          placeholder="Název"
          value={newIngredient.name}
          onChange={(e) => handleNewChange("name", e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="number"
          placeholder="Kalorie / 1g"
          value={newIngredient.calories_per_gram}
          onChange={(e) => handleNewChange("calories_per_gram", e.target.value)}
          className="border p-2 rounded"
        />
        <select value={newIngredient.category_id} onChange={(e) => handleNewChange("category_id", e.target.value)} className="border p-2 rounded">
          <option value="">Vyber kategorii</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Default gramy"
          value={newIngredient.default_grams}
          onChange={(e) => handleNewChange("default_grams", e.target.value)}
          className="border p-2 rounded"
        />
        <select value={newIngredient.unit_name} onChange={(e) => handleNewChange("unit_name", e.target.value)} className="border p-2 rounded">
          <option value="">Vyber jednotku</option>
          {["g", "ml", "ks", "lžíce", "lžička", "šálek", "hrnek"].map((unit) => (
            <option key={unit} value={unit}>
              {unit}
            </option>
          ))}
        </select>
        <button onClick={handleCreate} className="bg-blue-600 text-white rounded px-3 py-2">
          ➕ Přidat
        </button>
      </div>

      <div className="space-y-4 mb-10">
        {filtered.map((ingredient) => {
          const editedItem = edited[ingredient.id] || {};
          return (
            <div key={ingredient.id} className="border rounded p-4 space-y-2 sm:flex sm:flex-wrap sm:items-center sm:space-y-0 sm:gap-2">
              <input
                type="text"
                value={editedItem.name ?? ingredient.name}
                onChange={(e) => handleInputChange(ingredient.id, "name", e.target.value)}
                className="border rounded p-2 w-full sm:w-auto flex-grow"
              />
              <input
                type="number"
                value={editedItem.calories_per_gram ?? ingredient.calories_per_gram ?? ""}
                onChange={(e) => handleInputChange(ingredient.id, "calories_per_gram", e.target.value)}
                className="border rounded p-2 w-full sm:w-auto"
              />
              <select
                value={editedItem.category_id ?? ingredient.category_id ?? ""}
                onChange={(e) => handleInputChange(ingredient.id, "category_id", e.target.value)}
                className="border rounded p-2 w-full sm:w-auto flex-grow"
              >
                <option value="">Vyber kategorii</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Gramy"
                value={editedItem.default_grams ?? ingredient.default_grams ?? ""}
                onChange={(e) => handleInputChange(ingredient.id, "default_grams", e.target.value)}
                className="border rounded p-2 w-full sm:w-auto"
              />
              <select
                value={editedItem.unit_name ?? ingredient.unit_name ?? ""}
                onChange={(e) => handleInputChange(ingredient.id, "unit_name", e.target.value)}
                className="border rounded p-2 w-full sm:w-auto"
              >
                <option value="">Vyber jednotku</option>
                {["g", "ml", "ks", "lžíce", "lžička", "šálek", "hrnek"].map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
              <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                <button onClick={() => handleSave(ingredient.id)} className="bg-green-600 text-white px-3 py-2 rounded w-full sm:w-auto">
                  💾 Uložit
                </button>
                <button onClick={() => handleDelete(ingredient.id)} className="bg-red-600 text-white px-3 py-2 rounded w-full sm:w-auto">
                  🗑️ Smazat
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <h2 className="text-xl font-semibold mb-2">Kategorie</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
        <input type="text" placeholder="Nová kategorie" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="border p-2 rounded" />
        <button onClick={handleCategoryCreate} className="bg-blue-600 text-white px-3 py-2 rounded">
          ➕ Přidat kategorii
        </button>
      </div>

      <div className="space-y-2">
        {categories.map((cat) => (
          <div key={cat.id} className="flex gap-2 items-center">
            <input
              type="text"
              value={editedCategories[cat.id] ?? cat.name}
              onChange={(e) => setEditedCategories((prev) => ({ ...prev, [cat.id]: e.target.value }))}
              className="border p-2 rounded w-full sm:w-1/3"
            />
            <button onClick={() => handleCategoryUpdate(cat.id)} className="bg-green-600 text-white px-3 py-2 rounded">
              💾
            </button>
            <button onClick={() => handleCategoryDelete(cat.id)} className="bg-red-600 text-white px-3 py-2 rounded">
              🗑️
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}