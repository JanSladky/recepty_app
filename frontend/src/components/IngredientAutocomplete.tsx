"use client";

import React, { useState, useEffect, useImperativeHandle, forwardRef } from "react";

export type Ingredient = {
  name: string;
  amount: number;
  unit: string;
};

export type IngredientAutocompleteHandle = {
  getIngredients: () => Ingredient[];
};

type Props = {
  initialIngredients?: Ingredient[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const heuristics = [
  { keywords: ["jogurt", "mléko", "smetana", "olej", "sirup", "šťáva"], unit: "ml", amount: 100 },
  { keywords: ["vejce", "párek", "klobása", "šunka", "rajče", "cibule", "kuře"], unit: "ks", amount: 1 },
  { keywords: ["máslo", "mouka", "cukr", "sýr", "strouhanka", "rýže", "těstoviny"], unit: "g", amount: 100 },
];

function getDefaultForIngredient(name: string): { unit: string; amount: number } {
  const lower = name.toLowerCase();
  for (const rule of heuristics) {
    if (rule.keywords.some((k) => lower.includes(k))) {
      return { unit: rule.unit, amount: rule.amount };
    }
  }
  return { unit: "g", amount: 0 };
}

const IngredientAutocomplete = forwardRef<IngredientAutocompleteHandle, Props>(({ initialIngredients = [] }, ref) => {
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [filtered, setFiltered] = useState<string[]>([]);
  const [amount, setAmount] = useState<number>(0);
  const [unit, setUnit] = useState<string>("g");

  useImperativeHandle(ref, () => ({
    getIngredients: () => ingredients,
  }));

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await fetch(`${API_URL}/api/ingredients`);
        const data = await res.json();
        const names = data.map((i: { name: string }) => i.name);
        setSuggestions(names);
      } catch (err) {
        console.error("❌ Chyba při načítání autocomplete surovin:", err);
      }
    };

    fetchSuggestions();
  }, []);

  const normalize = (str: string) =>
    str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

    if (value.length > 0) {
      const normalized = normalize(value);
      const matches = suggestions.filter((s) => normalize(s).includes(normalized));
      setFiltered(matches.slice(0, 10));
    } else {
      setFiltered([]);
    }
  };

  const handleSelect = (name: string) => {
    if (name.trim() === "") return;
    if ((unit === "g" || unit === "ml") && amount <= 0) return;
    const alreadyExists = ingredients.some((i) => i.name === name && i.unit === unit);
    if (alreadyExists) return;

    setIngredients((prev) => [...prev, { name, amount, unit }]);
    setInput("");
    setAmount(0);
    setUnit("g");
    setFiltered([]);
  };

  const removeIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <input type="text" value={input} onChange={handleInputChange} placeholder="Název suroviny" className="flex-1 p-2 border rounded" />
        <select value={unit} onChange={(e) => setUnit(e.target.value)} className="w-24 p-2 border rounded">
          <option value="g">g</option>
          <option value="ml">ml</option>
          <option value="ks">ks</option>
          <option value="hrst">hrst</option>
          <option value="špetka">špetka</option>
          <option value="lžička">lžička</option>
          <option value="lžíce">lžíce</option>
        </select>
        {(unit === "g" || unit === "ml") && (
          <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} placeholder="Množství" className="w-24 p-2 border rounded" />
        )}
        <button type="button" onClick={() => handleSelect(input)} className="bg-blue-600 text-white px-3 py-2 rounded">
          ➕ Přidat
        </button>
      </div>

      {filtered.length > 0 && (
        <ul className="border rounded p-2 bg-white shadow">
          {filtered.map((suggestion) => (
            <li
              key={suggestion}
              className="cursor-pointer px-2 py-1 hover:bg-gray-100"
              onClick={() => {
                const defaults = getDefaultForIngredient(suggestion);
                setInput(suggestion);
                setAmount(defaults.amount);
                setUnit(defaults.unit);
                setFiltered([]);
              }}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}

      <div>
        <h3 className="font-semibold mb-2">Zvolené suroviny:</h3>
        <ul className="space-y-1 text-sm">
          {ingredients.map((ing, i) => (
            <li key={i} className="flex justify-between items-center">
              <span>
                {ing.name} – {["hrst", "špetka"].includes(ing.unit) ? ing.unit : `${ing.amount} ${ing.unit}`}
              </span>
              <button type="button" onClick={() => removeIngredient(i)} className="text-red-600 text-xs hover:underline">
                Odebrat
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
});

IngredientAutocomplete.displayName = "IngredientAutocomplete";
export default IngredientAutocomplete;
