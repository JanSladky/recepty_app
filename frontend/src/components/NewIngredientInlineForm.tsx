// components/NewIngredientInlineForm.tsx
import React, { useEffect, useState } from "react";

export default function NewIngredientInlineForm({ defaultName = "", onCreated }: { defaultName: string, onCreated: () => void }) {
  const [name, setName] = useState(defaultName);
  const [calories, setCalories] = useState("");
  const [unit, setUnit] = useState("");
  const [defaultGrams, setDefaultGrams] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/ingredient-categories")
      .then((res) => res.json())
      .then(setCategories);
  }, []);

  const handleSubmit = async () => {
    const res = await fetch("/api/ingredients", {
      method: "POST",
      body: JSON.stringify({
        name,
        calories: parseFloat(calories),
        unit_name: unit,
        default_grams: parseFloat(defaultGrams),
        category_id: parseInt(categoryId),
      }),
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      onCreated();
    } else {
      alert("Chyba při ukládání suroviny");
    }
  };

  return (
    <div className="p-4 border rounded mt-2 space-y-2 bg-gray-50">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Název" className="p-2 border rounded w-full" />
      <input value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="Kalorie / 1g" type="number" className="p-2 border rounded w-full" />
      <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Jednotka (např. g)" className="p-2 border rounded w-full" />
      <input value={defaultGrams} onChange={(e) => setDefaultGrams(e.target.value)} placeholder="Default gramy" type="number" className="p-2 border rounded w-full" />
      <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="p-2 border rounded w-full">
        <option value="">Vyber kategorii</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>{cat.name}</option>
        ))}
      </select>
      <button onClick={handleSubmit} className="bg-blue-600 text-white px-4 py-2 rounded">Přidat surovinu</button>
    </div>
  );
}