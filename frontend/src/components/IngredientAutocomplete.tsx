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
  amount: number;
  unit: "g";
  calories_per_gram: number;
};

export type IngredientAutocompleteHandle = {
  getIngredients: () => Ingredient[];
};

type IngredientAutocompleteProps = {
  initialIngredients?: Ingredient[];
  onChange?: (ingredients: Ingredient[]) => void;
};

const IngredientAutocomplete = forwardRef<
  IngredientAutocompleteHandle,
  IngredientAutocompleteProps
>(({ initialIngredients = [], onChange }, ref) => {
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    initialIngredients
  );
  const [inputName, setInputName] = useState("");
  const [inputAmount, setInputAmount] = useState<number | "">("");
  const [inputCalories, setInputCalories] = useState<number | "">("");
  const [allSuggestions, setAllSuggestions] = useState<
    { name: string; calories_per_gram: number }[]
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const inputNameRef = useRef<HTMLInputElement>(null);
  const inputAmountRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    getIngredients: () => ingredients,
  }));

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ingredients`)
      .then((res) => {
        if (!res.ok)
          throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => setAllSuggestions(data))
      .catch((err) =>
        console.error("❌ Nelze načíst seznam surovin:", err)
      );
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () =>
      document.removeEventListener("click", handleClickOutside);
  }, []);

  const notifyChange = (next: Ingredient[]) => {
    setIngredients(next);
    onChange?.(next);
  };

  const handleSelectSuggestion = (name: string) => {
    const match = allSuggestions.find(
      (i) => i.name.toLowerCase() === name.toLowerCase()
    );
    if (match) {
      setInputName(match.name);
      setInputCalories(Number(match.calories_per_gram));
      setTimeout(() => inputAmountRef.current?.focus(), 0);
    }
    setShowSuggestions(false);
  };

  const handleAddIngredient = () => {
    if (
      inputName.trim() === "" ||
      inputAmount === "" ||
      inputCalories === ""
    )
      return;

    const newIngredient: Ingredient = {
      name: inputName.trim(),
      amount: Number(inputAmount),
      unit: "g",
      calories_per_gram: Number(inputCalories),
    };

    console.log("🧪 Přidávám surovinu:", newIngredient);

    notifyChange([...ingredients, newIngredient]);

    setInputName("");
    setInputAmount("");
    setInputCalories("");
    setShowSuggestions(false);
    inputNameRef.current?.focus();
  };

  const handleDeleteIngredient = (index: number) => {
    notifyChange(ingredients.filter((_, i) => i !== index));
  };

  const suggestions = allSuggestions
    .filter(
      (i) =>
        inputName &&
        i.name.toLowerCase().includes(inputName.toLowerCase())
    )
    .slice(0, 5);

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
            placeholder="Název"
            className="p-2 border rounded w-full sm:w-1/3"
          />

          <input
            type="number"
            value={inputAmount}
            onChange={(e) =>
              setInputAmount(
                e.target.value === "" ? "" : Number(e.target.value)
              )
            }
            placeholder="Množství"
            ref={inputAmountRef}
            className="p-2 border rounded w-full sm:w-1/4"
          />

          <input
            type="text"
            value="g"
            readOnly
            disabled
            className="p-2 border rounded w-full sm:w-1/6 bg-gray-100 text-gray-500"
          />

          <input
            type="number"
            value={
              inputCalories !== null && inputCalories !== undefined
                ? inputCalories
                : ""
            }
            placeholder="kcal/g"
            readOnly
            className="p-2 border rounded w-full sm:w-1/4 bg-gray-100 text-gray-700"
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
              {ing.name} – {ing.amount} g (
              {Math.round(ing.amount * ing.calories_per_gram)} kcal)
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

// ✅ doplněno kvůli ESLint chybě "react/display-name"
IngredientAutocomplete.displayName = "IngredientAutocomplete";

export default IngredientAutocomplete;
