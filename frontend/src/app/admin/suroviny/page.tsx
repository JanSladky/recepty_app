"use client";

import { useEffect, useState } from "react";
import useAdmin from "@/hooks/useAdmin";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type Ingredient = {
  id: number;
  name: string;
  calories_per_gram: number;
  category_id: number;
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
  const [newCategory, setNewCategory] = useState("");
  const [editedCategories, setEditedCategories] = useState<Record<number, string>>({});

  useEffect(() => {
    const fetchIngredients = async () => {
      const res = await fetch(`${API_URL}/api/ingredients`);
      const data = await res.json();
      setIngredients(data);
    };

    const fetchCategories = async () => {
      const res = await fetch(`${API_URL}/api/ingredients/categories`);
      const data = await res.json();
      setCategories(data);
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
        [field]: field === "calories_per_gram" || field === "category_id" ? Number(value) : value,
      },
    }));
  };

  const handleSave = async (id: number) => {
    const current = ingredients.find((i) => i.id === id);
    if (!current) return;

    const updated = {
      name: edited[id]?.name ?? current.name,
      calories_per_gram: Number(edited[id]?.calories_per_gram ?? current.calories_per_gram),
      category_id: Number(edited[id]?.category_id ?? current.category_id),
    };

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
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Opravdu chceš smazat surovinu?")) return;

    const res = await fetch(`${API_URL}/api/ingredients/${id}`, { method: "DELETE" });
    if (res.ok) {
      setIngredients((prev) => prev.filter((i) => i.id !== id));
    }
  };

  const handleNewChange = (field: keyof typeof newIngredient, value: string) => {
    setNewIngredient((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreate = async () => {
    const { name, calories_per_gram, category_id } = newIngredient;
    const res = await fetch(`${API_URL}/api/ingredients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        category_id: Number(category_id),
        calories_per_gram: Number(calories_per_gram),
      }),
    });

    if (res.ok) {
      const created = await res.json();
      setIngredients((prev) => [...prev, created]);
      setNewIngredient({ name: "", calories_per_gram: "", category_id: "" });
    }
  };

  const handleCategoryUpdate = async (id: number) => {
    const name = editedCategories[id];
    if (!name) return;

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
    }
  };

  const handleCategoryDelete = async (id: number) => {
    if (!confirm("Opravdu chceš smazat tuto kategorii?")) return;

    const res = await fetch(`${API_URL}/api/ingredients/categories/${id}`, {
      method: "DELETE" });

    if (res.ok) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const handleCategoryCreate = async () => {
    const res = await fetch(`${API_URL}/api/ingredients/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategory }),
    });

    if (res.ok) {
      const created = await res.json();
      setCategories((prev) => [...prev, created]);
      setNewCategory("");
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

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-4">
        <input type="text" placeholder="Název" value={newIngredient.name} onChange={(e) => handleNewChange("name", e.target.value)} className="border p-2 rounded" />
        <input type="number" placeholder="Kalorie / 1g" value={newIngredient.calories_per_gram || ""} onChange={(e) => handleNewChange("calories_per_gram", e.target.value)} className="border p-2 rounded" />
        <select value={newIngredient.category_id || ""} onChange={(e) => handleNewChange("category_id", e.target.value)} className="border p-2 rounded">
          <option value="">Vyber kategorii</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <button onClick={handleCreate} className="bg-blue-600 text-white rounded px-3 py-2">➕ Přidat</button>
      </div>

      <div className="space-y-4 mb-10">
        {filtered.map((ingredient) => {
          const editedItem = edited[ingredient.id] || {};
          return (
            <div key={ingredient.id} className="border rounded p-4 space-y-2 sm:flex sm:items-center sm:space-y-0 sm:space-x-4">
              <input type="text" value={editedItem.name ?? ingredient.name} onChange={(e) => handleInputChange(ingredient.id, "name", e.target.value)} className="border rounded p-2 w-full sm:w-1/4" />
              <input type="number" value={editedItem.calories_per_gram ?? ingredient.calories_per_gram ?? ""} onChange={(e) => handleInputChange(ingredient.id, "calories_per_gram", e.target.value)} className="border rounded p-2 w-full sm:w-1/4" />
              <select value={editedItem.category_id ?? ingredient.category_id ?? ""} onChange={(e) => handleInputChange(ingredient.id, "category_id", e.target.value)} className="border rounded p-2 w-full sm:w-1/4">
                <option value="">Vyber kategorii</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                <button onClick={() => handleSave(ingredient.id)} className="bg-green-600 text-white px-3 py-2 rounded w-full sm:w-auto">💾 Uložit</button>
                <button onClick={() => handleDelete(ingredient.id)} className="bg-red-600 text-white px-3 py-2 rounded w-full sm:w-auto">🗑️ Smazat</button>
              </div>
            </div>
          );
        })}
      </div>

      <h2 className="text-xl font-semibold mb-2">Kategorie</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
        <input type="text" placeholder="Nová kategorie" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="border p-2 rounded" />
        <button onClick={handleCategoryCreate} className="bg-blue-600 text-white px-3 py-2 rounded">➕ Přidat kategorii</button>
      </div>

      <div className="space-y-2">
        {categories.map((cat) => (
          <div key={cat.id} className="flex gap-2 items-center">
            <input
              type="text"
              value={editedCategories[cat.id] ?? cat.name}
              onChange={(e) =>
                setEditedCategories((prev) => ({
                  ...prev,
                  [cat.id]: e.target.value,
                }))
              }
              className="border p-2 rounded w-full sm:w-1/3"
            />
            <button onClick={() => handleCategoryUpdate(cat.id)} className="bg-green-600 text-white px-3 py-2 rounded">💾</button>
            <button onClick={() => handleCategoryDelete(cat.id)} className="bg-red-600 text-white px-3 py-2 rounded">🗑️</button>
          </div>
        ))}
      </div>
    </main>
  );
}