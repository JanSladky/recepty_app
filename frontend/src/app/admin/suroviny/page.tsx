"use client";

import { useEffect, useState } from "react";
import useAdmin from "@/hooks/useAdmin";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type Ingredient = {
  id: number;
  name: string;
  calories_per_gram: number;
  category: string;
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
  });

  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        const res = await fetch(`${API_URL}/api/ingredients`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setIngredients(data);
        } else {
          console.error("❌ Neočekávaný formát dat:", data);
        }
      } catch (err) {
        console.error("❌ Chyba při načítání surovin:", err);
      }
    };

    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_URL}/api/ingredients/categories`);
        const data = await res.json();
        setCategories(data);
      } catch (err) {
        console.error("❌ Chyba při načítání kategorií:", err);
      }
    };

    fetchIngredients();
    fetchCategories();
  }, []);

  const handleInputChange = (id: number, field: keyof Ingredient, value: string | number) => {
    setEdited((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: field === "calories_per_gram" ? Number(value) : value,
      },
    }));
  };

  const handleSave = async (id: number) => {
    const current = ingredients.find((i) => i.id === id);
    if (!current) return;

    const updatedCategory = edited[id]?.category ?? current.category;
    const updatedCalories = edited[id]?.calories_per_gram ?? current.calories_per_gram;

    const updated = {
      name: edited[id]?.name ?? current.name,
      calories_per_gram: Number(updatedCalories),
      category: updatedCategory,
    };

    try {
      const res = await fetch(`${API_URL}/api/ingredients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      if (res.ok) {
        setIngredients((prev) => prev.map((i) => (i.id === id ? { ...i, ...updated } : i)));
        const copy = { ...edited };
        delete copy[id];
        setEdited(copy);
      } else {
        const error = await res.json();
        console.error("❌ Backend error:", error);
        alert("❌ Nepodařilo se uložit změny.");
      }
    } catch (err) {
      console.error("❌ Chyba při ukládání:", err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Opravdu chceš smazat surovinu?")) return;

    try {
      const res = await fetch(`${API_URL}/api/ingredients/${id}`, { method: "DELETE" });
      if (res.ok) {
        setIngredients((prev) => prev.filter((i) => i.id !== id));
      } else {
        alert("❌ Chyba při mazání.");
      }
    } catch (err) {
      console.error("❌ Chyba při mazání:", err);
    }
  };

  const handleNewChange = (field: keyof typeof newIngredient, value: string) => {
    setNewIngredient((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreate = async () => {
    const { name, calories_per_gram, category_id } = newIngredient;
    if (!name || !calories_per_gram || !category_id) return;

    try {
      const selectedCategoryName = categories.find((c) => String(c.id) === category_id)?.name;
      if (!selectedCategoryName) {
        alert("❌ Neplatná kategorie.");
        return;
      }

      const res = await fetch(`${API_URL}/api/ingredients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category: selectedCategoryName,
          calories_per_gram: Number(calories_per_gram),
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setIngredients((prev) => [...prev, created]);
        setNewIngredient({ name: "", calories_per_gram: "", category_id: "" });
      } else {
        alert("❌ Nepodařilo se přidat surovinu.");
      }
    } catch (err) {
      console.error("❌ Chyba při vytváření:", err);
    }
  };

  if (loading) return <p>Načítání...</p>;
  if (!isAdmin) return <p>Přístup zamítnut.</p>;

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

      <div className="grid grid-cols-4 gap-2 mb-4">
        <input
          type="text"
          placeholder="Název"
          value={newIngredient.name}
          onChange={(e) => handleNewChange("name", e.target.value)}
          className="border p-2 rounded col-span-1"
        />
        <input
          type="number"
          placeholder="Kalorie / 1g"
          value={newIngredient.calories_per_gram || ""}
          onChange={(e) => handleNewChange("calories_per_gram", e.target.value)}
          className="border p-2 rounded col-span-1"
        />
        <select
          value={newIngredient.category_id || ""}
          onChange={(e) => handleNewChange("category_id", e.target.value)}
          className="border p-2 rounded col-span-1"
        >
          <option value="">Vyber kategorii</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <button onClick={handleCreate} className="bg-blue-600 text-white rounded px-3 py-2 col-span-1">
          ➕ Přidat
        </button>
      </div>

      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Název</th>
            <th className="p-2 border">Kalorie / 1g</th>
            <th className="p-2 border">Kategorie</th>
            <th className="p-2 border">Akce</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((ingredient) => {
            const editedItem = edited[ingredient.id] || {};
            return (
              <tr key={ingredient.id}>
                <td className="p-2 border">
                  <input
                    type="text"
                    value={editedItem.name ?? ingredient.name}
                    onChange={(e) => handleInputChange(ingredient.id, "name", e.target.value)}
                    className="w-full border rounded p-1"
                  />
                </td>
                <td className="p-2 border">
                  <input
                    type="number"
                    value={editedItem.calories_per_gram ?? ingredient.calories_per_gram ?? ""}
                    onChange={(e) => handleInputChange(ingredient.id, "calories_per_gram", e.target.value)}
                    className="w-full border rounded p-1"
                  />
                </td>
                <td className="p-2 border">
                  <select
                    value={editedItem.category ?? ingredient.category ?? ""}
                    onChange={(e) => handleInputChange(ingredient.id, "category", e.target.value)}
                    className="w-full border rounded p-1"
                  >
                    <option value="">Vyber kategorii</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-2 border space-x-1">
                  <button onClick={() => handleSave(ingredient.id)} className="bg-green-600 text-white px-2 py-1 rounded">
                    💾 Uložit
                  </button>
                  <button onClick={() => handleDelete(ingredient.id)} className="bg-red-600 text-white px-2 py-1 rounded">
                    🗑️ Smazat
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
}
