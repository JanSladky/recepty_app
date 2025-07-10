"use client";

import React, { forwardRef, useImperativeHandle, useState, useEffect } from "react";

export type Ingredient = {
  name: string;
  amount: number;
  unit: Unit;
  default_grams?: number;
  calories_per_gram: number;
};
export type IngredientAutocompleteHandle = {
  getIngredients: () => Ingredient[];
  setInitialIngredients: (ingredients: Ingredient[]) => void;
};

type IngredientAutocompleteProps = {
  initialIngredients?: Ingredient[];
};

type Suggestion = {
  name: string;
  calories_per_gram: number;
  unit_name?: string;
};

type NewIngredient = {
  name: string;
  calories_per_gram: number;
  category_id: number | "";
  default_grams?: number;
  unit_name?: string;
};

type Category = {
  id: number;
  name: string;
};

const units = ["g", "ml", "ks", "lžíce", "lžička", "šálek", "hrnek"] as const;
type Unit = typeof units[number];

const IngredientAutocomplete = forwardRef<IngredientAutocompleteHandle, IngredientAutocompleteProps>(({ initialIngredients = [] }, ref) => {
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    initialIngredients.length > 0 ? initialIngredients : [{ name: "", amount: 0, unit: "g", calories_per_gram: 0 }]
  );
  const [allSuggestions, setAllSuggestions] = useState<Suggestion[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newIngredient, setNewIngredient] = useState<NewIngredient>({
    name: "",
    calories_per_gram: 0,
    category_id: "",
    default_grams: undefined,
    unit_name: "",
  });
  const [focusedInputIndex, setFocusedInputIndex] = useState<number | null>(null);

  useImperativeHandle(ref, () => ({
    getIngredients: () => ingredients,
    setInitialIngredients: (initial) => {
      setIngredients(initial.length > 0 ? initial : [{ name: "", amount: 0, unit: "g", calories_per_gram: 0 }]);
    },
  }));

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ingredients`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then(setAllSuggestions)
      .catch((err) => console.error("❌ Nelze načíst seznam surovin:", err));
  }, []);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ingredients/categories`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then(setCategories)
      .catch((err) => console.error("❌ Nelze načíst kategorie:", err));
  }, []);

  const handleInputChange = (index: number, field: keyof Ingredient, value: string) => {
    const updated = [...ingredients];

    if (field === "amount" || field === "calories_per_gram") {
      updated[index] = {
        ...updated[index],
        [field]: parseFloat(value) || 0,
      };
    } else if (field === "unit") {
      updated[index] = {
        ...updated[index],
        unit: value as Unit,
      };
    } else if (field === "name") {
      updated[index] = {
        ...updated[index],
        name: value,
      };

      const found = allSuggestions.find((s) => s.name.toLowerCase() === value.toLowerCase());
      if (found) {
        updated[index].calories_per_gram = found.calories_per_gram;
        if (found.unit_name) {
          updated[index].unit = found.unit_name as Unit;
        }
      }
    }

    setIngredients(updated);
  };

  const selectSuggestion = (index: number, suggestion: Suggestion) => {
    const updated = [...ingredients];
    updated[index].name = suggestion.name;
    updated[index].calories_per_gram = suggestion.calories_per_gram;
    updated[index].unit = (suggestion.unit_name as Unit) || "g";
    setIngredients(updated);
    setFocusedInputIndex(null);
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: "", amount: 0, unit: "g", calories_per_gram: 0 }]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleNewChange = (field: keyof NewIngredient, value: string | number) => {
    setNewIngredient({
      ...newIngredient,
      [field]: field === "category_id" ? parseInt(value as string) : value,
    });
  };

  const handleCreate = async () => {
    console.log("⏩ Odesílám novou surovinu:", newIngredient);
    if (!newIngredient.name.trim() || !newIngredient.category_id || !newIngredient.calories_per_gram) {
      alert("Vyplň prosím název, kategorii a kalorie.");
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ingredients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newIngredient,
          calories_per_gram: parseFloat(newIngredient.calories_per_gram.toString()),
          default_grams: newIngredient.default_grams ? parseFloat(newIngredient.default_grams.toString()) : undefined,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Nepodařilo se přidat ingredienci");
      }
      const createdIngredient = await res.json();
      setIngredients((prev) => [
        ...prev,
        {
          name: createdIngredient.name,
          amount: 0,
          unit: createdIngredient.unit_name || "g", // zůstane takto
          calories_per_gram: createdIngredient.calories_per_gram,
        },
      ]);

      alert("Ingredience přidána.");
      setNewIngredient({
        name: "",
        calories_per_gram: 0,
        category_id: "",
        default_grams: undefined,
        unit_name: "",
      });
    } catch (err) {
      console.error("Chyba při přidání ingredience:", err);
      alert("Nepodařilo se přidat ingredienci.");
    }
  };

  return (
    <div className="space-y-4">
      {ingredients.map((ingredient, index) => {
        const filtered = ingredient.name.length >= 3 ? allSuggestions.filter((s) => s.name.toLowerCase().includes(ingredient.name.toLowerCase())) : [];

        return (
          <div key={index} className="relative grid grid-cols-1 sm:grid-cols-5 gap-2 items-center border rounded p-3 bg-gray-50">
            <div className="relative col-span-2">
              <input
                type="text"
                value={ingredient.name}
                onChange={(e) => handleInputChange(index, "name", e.target.value)}
                onFocus={() => setFocusedInputIndex(index)}
                onBlur={() => setTimeout(() => setFocusedInputIndex(null), 200)}
                placeholder="Název suroviny"
                className="border p-2 rounded w-full"
                required
              />
              {focusedInputIndex === index && filtered.length > 0 && (
                <div className="absolute bg-white border rounded shadow max-h-40 overflow-y-auto w-full z-10">
                  {filtered.map((s) => (
                    <div key={s.name} onClick={() => selectSuggestion(index, s)} className="p-2 hover:bg-gray-100 cursor-pointer">
                      {s.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <input
              type="number"
              value={ingredient.amount}
              onChange={(e) => handleInputChange(index, "amount", e.target.value)}
              placeholder="Množství"
              className="border p-2 rounded w-full"
              required
            />

            <select value={ingredient.unit || "g"} onChange={(e) => handleInputChange(index, "unit", e.target.value)} className="border p-2 rounded w-full">
              {units.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>

            <input
              type="number"
              value={ingredient.calories_per_gram}
              onChange={(e) => handleInputChange(index, "calories_per_gram", e.target.value)}
              placeholder="Kalorie / gram"
              className="border p-2 rounded w-full"
              required
            />

            <button
              type="button"
              onClick={() => removeIngredient(index)}
              className="text-red-500 text-lg hover:text-red-700 transition-colors sm:col-span-full"
            >
              🗑
            </button>
          </div>
        );
      })}

      <button type="button" onClick={addIngredient} className="bg-green-600 text-white px-4 py-1 rounded">
        ➕ Přidat surovinu
      </button>

      <div className="mt-6">
        <h4 className="font-semibold mb-4">Přidat novou ingredienci do databáze:</h4>
        <div className="flex flex-wrap gap-3 mb-4">
          <input
            type="text"
            placeholder="Název"
            value={newIngredient.name}
            onChange={(e) => handleNewChange("name", e.target.value)}
            className="border p-2 rounded w-full sm:w-[150px] flex-1 min-w-[120px]"
          />
          <input
            type="number"
            placeholder="Kalorie / 1g"
            value={newIngredient.calories_per_gram}
            onChange={(e) => handleNewChange("calories_per_gram", e.target.value)}
            className="border p-2 rounded w-32"
          />
          <select value={newIngredient.category_id} onChange={(e) => handleNewChange("category_id", e.target.value)} className="border p-2 rounded w-48">
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
            value={newIngredient.default_grams || ""}
            onChange={(e) => handleNewChange("default_grams", e.target.value)}
            className="border p-2 rounded w-32"
          />
          <select value={newIngredient.unit_name || ""} onChange={(e) => handleNewChange("unit_name", e.target.value)} className="border p-2 rounded w-32">
            <option value="">Jednotka</option>
            {units.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
          <button type="button" onClick={handleCreate} className="bg-blue-600 text-white rounded px-4 py-2">
            ➕ Přidat
          </button>
        </div>
      </div>
    </div>
  );
});

IngredientAutocomplete.displayName = "IngredientAutocomplete";
export default IngredientAutocomplete;
