"use client";

import { useEffect, useState } from "react";
import useAdmin from "@/hooks/useAdmin";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// --- Helper Icons ---
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
  calories_per_gram: number;
  category_id: number;
  default_grams?: number | null;
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
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/api/ingredients`);
        if (!res.ok) throw new Error("Nepodařilo se načíst suroviny");
        const data = await res.json();
        setIngredients(data);
      } catch (error) {
        console.error("Chyba při načítání surovin:", error);
      }
    };

    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/api/ingredients/categories`);
        if (!res.ok) throw new Error("Nepodařilo se načíst kategorie");
        const data = await res.json();
        setCategories(data);
      } catch (error) {
        console.error("Chyba při načítání kategorií:", error);
      }
    };

    fetchIngredients();
    fetchCategories();
  }, []);

  if (loading) return <p className="text-center p-10">Načítání oprávnění...</p>;
  if (!isAdmin) return <p className="text-center p-10 text-red-600 font-semibold">Nemáš oprávnění pro přístup k této stránce.</p>;

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
    const mergedData = { ...current, ...editedData };
    // OPRAVA: Nahradili jsme 'any' za specifické typy, abychom prošli kontrolou ESLint.
    const valueOrNull = (val: string | number | null | undefined) => (val === "" || val == null ? null : Number(val));

    const finalPayload = {
      ...mergedData,
      calories_per_gram: Number(mergedData.calories_per_gram),
      category_id: Number(mergedData.category_id),
      default_grams: valueOrNull(mergedData.default_grams),
      unit_name: mergedData.unit_name === "" || mergedData.unit_name == null ? null : mergedData.unit_name,
    };

    if (!finalPayload.category_id) {
      alert("Chyba: Kategorie je povinný údaj.");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_URL}/api/ingredients/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // ✅ zde přidáno
        },
        body: JSON.stringify(finalPayload),
      });

      if (res.ok) {
        alert("Surovina úspěšně uložena!");
        setIngredients((prev) => prev.map((ing) => (ing.id === id ? finalPayload : ing)));
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

    const token = localStorage.getItem("token"); // ✅ načti token z localStorage

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/ingredients/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`, // ✅ posíláme správně jako Bearer token
        },
      });

      if (res.ok) {
        setIngredients((prev) => prev.filter((i) => i.id !== id));
      } else {
        const errorText = await res.text();
        alert(`Smazání se nezdařilo: ${errorText}`);
      }
    } catch (error) {
      console.error("Chyba při mazání:", error);
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
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/ingredients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // ✅ zde přidáno
        },
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
    } catch (error) {
      console.error("Chyba při vytváření:", error);
      alert("Chyba při komunikaci se serverem.");
    }
  };

  const handleCategoryUpdate = async (id: number) => {
    const name = editedCategories[id];
    if (!name) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/ingredients/categories/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // ✅ zde přidáno
        },
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
    } catch (error) {
      console.error("Chyba při úpravě kategorie:", error);
      alert("Chyba při komunikaci se serverem.");
    }
  };

  const handleCategoryDelete = async (id: number) => {
    if (!confirm("Opravdu chceš smazat tuto kategorii?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/ingredients/categories/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`, // ✅ zde přidáno
        },
      });
      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
      } else {
        alert("Smazání kategorie se nezdařilo.");
      }
    } catch (error) {
      console.error("Chyba při mazání kategorie:", error);
      alert("Chyba při komunikaci se serverem.");
    }
  };

  const handleCategoryCreate = async () => {
    if (!newCategory.trim()) {
      alert("Název kategorie nemůže být prázdný.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/ingredients/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // ✅ zde přidáno
        },
        body: JSON.stringify({ name: newCategory }),
      });

      if (res.ok) {
        const created = await res.json();
        setCategories((prev) => [...prev, created]);
        setNewCategory("");
      } else {
        alert("Vytvoření kategorie se nezdařilo.");
      }
    } catch (error) {
      console.error("Chyba při vytváření kategorie:", error);
      alert("Chyba při komunikaci se serverem.");
    }
  };

  const filtered = ingredients.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="bg-gray-50 min-h-screen">
      <main className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-800">Správa surovin</h1>
          <p className="text-lg text-gray-500 mt-2">Přidávej a upravuj suroviny a kategorie.</p>
        </div>

        {/* --- Panel pro přidání a hledání --- */}
        <div className="bg-white p-6 rounded-2xl shadow-lg mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Přidat novou surovinu</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4 items-end">
            <input
              type="text"
              placeholder="Název"
              value={newIngredient.name}
              onChange={(e) => handleNewChange("name", e.target.value)}
              className="p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 transition md:col-span-2"
            />
            <input
              type="number"
              placeholder="kcal/1g"
              value={newIngredient.calories_per_gram}
              onChange={(e) => handleNewChange("calories_per_gram", e.target.value)}
              className="p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
            />
            <select
              value={newIngredient.category_id}
              onChange={(e) => handleNewChange("category_id", e.target.value)}
              className="p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
            >
              <option value="">Kategorie...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="g/ks"
              value={newIngredient.default_grams}
              onChange={(e) => handleNewChange("default_grams", e.target.value)}
              className="p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
            />
            <button
              onClick={handleCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-4 py-3 transition duration-200 w-full"
            >
              ➕ Přidat
            </button>
          </div>
          <div className="mt-6 border-t pt-6">
            <input
              type="text"
              placeholder="Hledat existující surovinu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
            />
          </div>
        </div>

        {/* --- Seznam surovin --- */}
        <div className="space-y-3">
          {filtered.map((ingredient) => {
            const editedItem = edited[ingredient.id] || {};
            return (
              <div key={ingredient.id} className="bg-white p-4 rounded-xl shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-3 items-center">
                <input
                  type="text"
                  value={editedItem.name ?? ingredient.name}
                  onChange={(e) => handleInputChange(ingredient.id, "name", e.target.value)}
                  className="border rounded-lg p-2 w-full md:col-span-2"
                />
                <input
                  type="number"
                  value={editedItem.calories_per_gram ?? ingredient.calories_per_gram ?? ""}
                  onChange={(e) => handleInputChange(ingredient.id, "calories_per_gram", e.target.value)}
                  className="border rounded-lg p-2 w-full"
                />
                <select
                  value={editedItem.category_id ?? ingredient.category_id ?? ""}
                  onChange={(e) => handleInputChange(ingredient.id, "category_id", e.target.value)}
                  className="border rounded-lg p-2 w-full"
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
                  placeholder="g/ks"
                  value={editedItem.default_grams ?? ingredient.default_grams ?? ""}
                  onChange={(e) => handleInputChange(ingredient.id, "default_grams", e.target.value)}
                  className="border rounded-lg p-2 w-full"
                />
                <select
                  value={editedItem.unit_name ?? ingredient.unit_name ?? ""}
                  onChange={(e) => handleInputChange(ingredient.id, "unit_name", e.target.value)}
                  className="border rounded-lg p-2 w-full"
                >
                  <option value="">Jednotka...</option>
                  {["g", "ml", "ks", "lžíce", "lžička", "šálek", "hrnek"].map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => handleSave(ingredient.id)}
                    className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition duration-200"
                  >
                    <IconSave />
                  </button>
                  <button onClick={() => handleDelete(ingredient.id)} className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition duration-200">
                    <IconTrash />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* --- Panel pro kategorie --- */}
        <div className="bg-white p-6 rounded-2xl shadow-lg mt-12">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Správa kategorií</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <input
              type="text"
              placeholder="Název nové kategorie"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 transition sm:col-span-2"
            />
            <button
              onClick={handleCategoryCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-4 py-3 transition duration-200 w-full"
            >
              ➕ Přidat kategorii
            </button>
          </div>
          <div className="space-y-2">
            {categories.map((cat) => (
              <div key={cat.id} className="flex gap-2 items-center bg-gray-50 p-2 rounded-lg">
                <input
                  type="text"
                  value={editedCategories[cat.id] ?? cat.name}
                  onChange={(e) => setEditedCategories((prev) => ({ ...prev, [cat.id]: e.target.value }))}
                  className="border rounded-lg p-2 w-full flex-grow"
                />
                <button
                  onClick={() => handleCategoryUpdate(cat.id)}
                  className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition duration-200"
                >
                  <IconSave />
                </button>
                <button onClick={() => handleCategoryDelete(cat.id)} className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition duration-200">
                  <IconTrash />
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
