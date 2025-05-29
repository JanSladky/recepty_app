"use client";

import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
  useRef,
} from "react";

export type Ingredient = {
  name: string;
  amount: number; // v gramech
  unit: string;   // vždy "g"
  calories_per_gram: number;
  display?: string; // např. "3 lžíce"
};

export type IngredientAutocompleteHandle = {
  getIngredients: () => Ingredient[];
  setInitialIngredients: (ingredients: Ingredient[]) => void;
};

type IngredientAutocompleteProps = {
  initialIngredients?: Ingredient[];
  onChange?: (ingredients: Ingredient[]) => void;
};

type Suggestion = {
  name: string;
  calories_per_gram: number;
  default_grams?: number;
  unit_name?: string;
};

const IngredientAutocomplete = forwardRef<
  IngredientAutocompleteHandle,
  IngredientAutocompleteProps
>(({ initialIngredients = [], onChange }, ref) => {
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients);
  const [inputName, setInputName] = useState("");
  const [inputAmount, setInputAmount] = useState<number | "">("");
  const [inputUnit, setInputUnit] = useState("g");
  const [inputCalories, setInputCalories] = useState<number | "">("");
  const [allSuggestions, setAllSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const inputNameRef = useRef<HTMLInputElement>(null);
  const inputAmountRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const unitConversionToGrams: Record<string, number> = {
    g: 1,
    lžíce: 13,
    lžička: 5,
    šálek: 240,
    hrnek: 240,
    ks: 50,
  };

  useImperativeHandle(ref, () => ({
    getIngredients: () => ingredients,
    setInitialIngredients: (newIngredients: Ingredient[]) => {
      setIngredients(newIngredients);
    },
  }));

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ingredients`)
      .then((res) => res.ok ? res.json() : Promise.reject(res.status))
      .then(setAllSuggestions)
      .catch((err) => console.error("❌ Nelze načíst seznam surovin:", err));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const notifyChange = (next: Ingredient[]) => {
    setIngredients(next);
    onChange?.(next);
  };

  const handleSelectSuggestion = (name: string) => {
    const match = allSuggestions.find((i) => i.name.toLowerCase() === name.toLowerCase());
    if (match) {
      setInputName(match.name);
      setInputCalories(match.calories_per_gram);
      if (match.unit_name) setInputUnit(match.unit_name);
      if (match.default_grams) setInputAmount(1); // předvyplní 1 ks
      setTimeout(() => inputAmountRef.current?.focus(), 0);
    }
    setShowSuggestions(false);
  };

  const handleAddIngredient = () => {
    if (!inputName.trim() || inputAmount === "" || inputCalories === "") {
      alert("⚠️ Vyplň název, množství i kalorie.");
      return;
    }

    const caloriesValue = Number(inputCalories);
    const amountValue = Number(inputAmount);
    if (isNaN(caloriesValue) || isNaN(amountValue)) {
      alert("⚠️ Neplatné číslo v poli pro množství nebo kalorie.");
      return;
    }

    const suggestion = allSuggestions.find(i => i.name.toLowerCase() === inputName.toLowerCase());
    const factor = suggestion?.default_grams || unitConversionToGrams[inputUnit] || 1;
    const amountInGrams = amountValue * factor;

    const newIngredient: Ingredient = {
      name: inputName.trim(),
      amount: amountInGrams,
      unit: "g",
      calories_per_gram: caloriesValue,
      display: `${amountValue} ${inputUnit}`, // uložení původního vstupu
    };

    notifyChange([...ingredients, newIngredient]);

    setInputName("");
    setInputAmount("");
    setInputCalories("");
    setInputUnit("g");
    inputNameRef.current?.focus();
  };

  const handleDeleteIngredient = (index: number) => {
    notifyChange(ingredients.filter((_, i) => i !== index));
  };

  const suggestions = inputName
    ? allSuggestions
        .filter((i) => i.name.toLowerCase().includes(inputName.toLowerCase()))
        .slice(0, 5)
    : [];

  const calculatedGrams = (): number => {
    const amt = typeof inputAmount === "number" ? inputAmount : 0;
    const suggestion = allSuggestions.find(i => i.name.toLowerCase() === inputName.toLowerCase());
    const conv = suggestion?.default_grams || unitConversionToGrams[inputUnit] || 1;
    return Math.round(amt * conv);
  };

  const calculatedCalories = (): number => {
    const grams = calculatedGrams();
    const kcalPerGram = typeof inputCalories === "number" ? inputCalories : 0;
    return Math.round(grams * kcalPerGram);
  };

  return (
    <div className="space-y-4 autocomplete-wrapper" ref={wrapperRef}>
      <div className="relative">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={inputName}
            onChange={(e) => {
              setInputName(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            ref={inputNameRef}
            placeholder="Název suroviny"
            className="p-2 border rounded w-full sm:w-1/3"
          />

          <input
            type="number"
            value={inputAmount}
            onChange={(e) =>
              setInputAmount(e.target.value === "" ? "" : Number(e.target.value))
            }
            placeholder="Množství"
            ref={inputAmountRef}
            className="p-2 border rounded w-full sm:w-1/6"
          />

          <select
            value={inputUnit}
            onChange={(e) => setInputUnit(e.target.value)}
            className="p-2 border rounded w-full sm:w-1/6"
          >
            {Object.keys(unitConversionToGrams).map((unit) => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>

          <input
            type="number"
            value={typeof inputCalories === "number" ? inputCalories : ""}
            placeholder="kcal/g"
            onChange={(e) =>
              setInputCalories(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="p-2 border rounded w-full sm:w-1/6"
          />
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-20 bg-white border w-full sm:w-1/3 mt-1 rounded shadow">
            {suggestions.map((s, index) => (
              <li
                key={index}
                onClick={() => handleSelectSuggestion(s.name)}
                className="p-2 hover:bg-green-100 cursor-pointer"
              >
                {s.name} ({s.calories_per_gram} kcal/g)
              </li>
            ))}
          </ul>
        )}
      </div>

      {inputAmount !== "" && inputCalories !== "" && (
        <p className="text-sm text-gray-600">
          Vypočteno: {calculatedGrams()} g – {calculatedCalories()} kcal
        </p>
      )}

      <button
        type="button"
        onClick={handleAddIngredient}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        ➕ Přidat surovinu
      </button>

      <ul className="space-y-2">
        {ingredients.map((ing, index) => (
          <li
            key={index}
            className="flex justify-between items-center border p-2 rounded"
          >
            <span>
              {ing.name} – {ing.display ?? `${Math.round(ing.amount)} g`} ({Math.round(ing.amount)} g, {Math.round(ing.amount * ing.calories_per_gram)} kcal)
            </span>
            <button
              type="button"
              onClick={() => handleDeleteIngredient(index)}
              className="text-red-600"
            >
              🗑
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
});

IngredientAutocomplete.displayName = "IngredientAutocomplete";

export default IngredientAutocomplete;