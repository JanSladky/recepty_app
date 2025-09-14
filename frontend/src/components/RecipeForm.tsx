"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import CategorySelector from "@/components/CategorySelector";
import MealTypeSelector from "@/components/MealTypeSelector";
import IngredientAutocomplete, {
  type IngredientAutocompleteHandle,
  type IngredientRow,
} from "@/components/IngredientAutocomplete";
import Image from "next/image";

// Helper icon component for UI elements
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
    className="feather feather-trash-2"
  >
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

export type RecipeFormProps = {
  initialTitle?: string;
  initialNotes?: string;
  initialImageUrl?: string | null;
  initialIngredients?: IngredientRow[];
  initialCategories?: string[];
  initialMealTypes?: string[];
  initialSteps?: string[];
  initialCalories?: number;
  onSubmit: (formData: FormData) => Promise<void>;
  submitLabel?: string;
  loading?: boolean;
};

export default function RecipeForm({
  initialTitle = "",
  initialNotes = "",
  initialIngredients = [],
  initialImageUrl = null,
  initialCategories = [],
  initialMealTypes = [],
  initialSteps = [],

  onSubmit,
  submitLabel = "Přidat recept",
  loading = false,
}: RecipeFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialImageUrl);
  const [categories, setCategories] = useState<string[]>(initialCategories);
  const [mealTypes, setMealTypes] = useState<string[]>(initialMealTypes ?? []);
  const [steps, setSteps] = useState<string[]>(initialSteps.length ? initialSteps : [""]);
  const [submitting, setSubmitting] = useState(false);

  const ingredientRef = useRef<IngredientAutocompleteHandle>(null);

  useEffect(() => {
    setImagePreview(initialImageUrl || null);
  }, [initialImageUrl]);

  // automatický výpočet kcal z aktuálního stavu ingrediencí
  const calories = useMemo(() => {
    const rows = ingredientRef.current?.getIngredients() ?? [];
    const total = rows.reduce((sum: number, ing: IngredientRow) => {
      const unit = ing.unit ?? "g";
      const amount = Number(ing.amount) || 0;
      const caloriesPerGram = Number(ing.calories_per_gram) || 0;
      const defaultGrams = Number(ing.default_grams) || 0;

      let grams = amount;
      if (unit !== "g" && unit !== "ml") {
        grams = defaultGrams ? amount * defaultGrams : 0;
      }

      return sum + grams * caloriesPerGram;
    }, 0);
    return Math.round(total);
  }, [ initialIngredients]); // recalculates when ref changes or initial changes

  const toggleCategory = (cat: string) => {
    setCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  };

  const toggleMealType = (type: string) => {
    setMealTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const rows = ingredientRef.current?.getIngredients() || [];
    if (rows.length === 0) {
      alert("Musíš zadat alespoň jednu surovinu.");
      setSubmitting(false);
      return;
    }

    // čisté ingredience pro POST/PUT
    const ingredients: IngredientRow[] = rows.map((ing) => ({
      ...ing,
      calories_per_gram: Number(ing.calories_per_gram || 0),
      amount: Number(ing.amount || 0),
      default_grams:
        ing.default_grams === undefined || ing.default_grams === null
          ? undefined
          : Number(ing.default_grams),
    }));

    const formData = new FormData();
formData.append("title", title.trim());
const cleanedNotes = typeof notes === "string" ? notes.trim() : "";
if (cleanedNotes) formData.append("notes", cleanedNotes);

// ❌ NE: formData.append("ingredients", JSON.stringify(ingredients));
// ✅ ANO: rozbalit po položkách jako ingredients[i][...]
ingredients.forEach((ing, i) => {
  formData.append(`ingredients[${i}][name]`, ing.name ?? "");
  formData.append(`ingredients[${i}][amount]`, String(ing.amount ?? 0));
  formData.append(`ingredients[${i}][unit]`, ing.unit ?? "g");
  formData.append(`ingredients[${i}][calories_per_gram]`, String(ing.calories_per_gram ?? 0));

  if (ing.default_grams != null) {
    formData.append(`ingredients[${i}][default_grams]`, String(ing.default_grams));
  }
  if (ing.display) {
    formData.append(`ingredients[${i}][display]`, ing.display);
  }

  // 🔴 DŮLEŽITÉ: OFF ID + všechna makra (na 100 g)
  if (ing.off_id) {
    formData.append(`ingredients[${i}][off_id]`, ing.off_id);
  }
  formData.append(`ingredients[${i}][energy_kcal_100g]`, ing.energy_kcal_100g == null ? "" : String(ing.energy_kcal_100g));
  formData.append(`ingredients[${i}][proteins_100g]`,      ing.proteins_100g == null ? "" : String(ing.proteins_100g));
  formData.append(`ingredients[${i}][carbs_100g]`,         ing.carbs_100g == null ? "" : String(ing.carbs_100g));
  formData.append(`ingredients[${i}][sugars_100g]`,        ing.sugars_100g == null ? "" : String(ing.sugars_100g));
  formData.append(`ingredients[${i}][fat_100g]`,           ing.fat_100g == null ? "" : String(ing.fat_100g));
  formData.append(`ingredients[${i}][saturated_fat_100g]`, ing.saturated_fat_100g == null ? "" : String(ing.saturated_fat_100g));
  formData.append(`ingredients[${i}][fiber_100g]`,         ing.fiber_100g == null ? "" : String(ing.fiber_100g));
  formData.append(`ingredients[${i}][sodium_100g]`,        ing.sodium_100g == null ? "" : String(ing.sodium_100g));

  // volitelné „kosmetické“ info z OFF (pokud si je chceš držet)
  if (ing.brands)          formData.append(`ingredients[${i}][brands]`, ing.brands);
  if (ing.quantity)        formData.append(`ingredients[${i}][quantity]`, ing.quantity);
  if (ing.image_small_url) formData.append(`ingredients[${i}][image_small_url]`, ing.image_small_url);
});

formData.append("categories", JSON.stringify(categories));
formData.append("mealTypes", JSON.stringify(mealTypes));
formData.append("steps", JSON.stringify(steps.filter((s) => s.trim() !== "")));
if (Number.isFinite(calories)) formData.append("calories", String(calories));

if (imageFile instanceof File) {
  formData.append("image", imageFile);
} else if (initialImageUrl) {
  formData.append("existingImageUrl", initialImageUrl);
}

const userEmail = typeof window !== "undefined" ? localStorage.getItem("userEmail") : null;
if (userEmail) formData.append("email", userEmail);

    await onSubmit(formData);
    setSubmitting(false);
  };

  const currentImage = imagePreview || "/placeholder.jpg";

  return (
    <form
      onSubmit={handleFormSubmit}
      className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg space-y-8 max-w-4xl mx-auto"
      encType="multipart/form-data"
    >
      {/* --- HLAVIČKA --- */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Základní informace</h2>
        <p className="text-gray-500 text-sm mt-1">Pojmenuj svůj recept a přidej krátký popis.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Název receptu (např. Špagety Carbonara)"
          required
          className="md:col-span-9 p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
        />
        <input
          type="number"
          value={Number.isFinite(calories) ? calories : ""}
          disabled
          readOnly
          placeholder="kcal"
          className="md:col-span-3 p-3 border border-gray-300 rounded-lg w-full bg-gray-100 text-center font-bold"
        />
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Krátký popis nebo poznámky k receptu..."
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
        rows={3}
      />

      {/* --- KATEGORIZACE --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6 border-t">
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Typ chodu</h3>
          <MealTypeSelector selected={mealTypes} onToggle={toggleMealType} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Kategorie</h3>
          <CategorySelector selected={categories} onToggle={toggleCategory} />
        </div>
      </div>

      {/* --- OBRÁZEK --- */}
      <div className="pt-6 border-t">
        <h2 className="text-2xl font-bold text-gray-800">Obrázek</h2>
        <p className="text-gray-500 text-sm mt-1">Nahraj fotku hotového jídla.</p>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setImageFile(file);
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => setImagePreview(reader.result as string);
                reader.readAsDataURL(file);
              } else {
                setImagePreview(initialImageUrl || null);
              }
            }}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
          />
          <div className="relative w-full h-40 rounded-lg overflow-hidden border">
            <Image
              src={currentImage}
              alt="Náhled obrázku"
              fill
              unoptimized
              onError={() => setImagePreview(null)}
              className="object-cover"
            />
          </div>
        </div>
      </div>

      {/* --- INGREDIENCE --- */}
      <div className="pt-6 border-t">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Ingredience</h2>
            <p className="text-gray-500 text-sm mt-1">
              Přidej všechny potřebné suroviny a jejich množství.
            </p>
          </div>
        </div>

        <div className="mt-4">
          <IngredientAutocomplete
            ref={ingredientRef}
            initialIngredients={initialIngredients}
          />
        </div>
      </div>

      {/* --- POSTUP --- */}
      <div className="pt-6 border-t">
        <h2 className="text-2xl font-bold text-gray-800">Postup</h2>
        <p className="text-gray-500 text-sm mt-1">Popiš jednotlivé kroky přípravy.</p>
        <div className="mt-4 space-y-4">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white flex items-center justify-center rounded-full font-bold text-sm">
                {index + 1}
              </div>
              <textarea
                value={step}
                onChange={(e) => {
                  const newSteps = [...steps];
                  newSteps[index] = e.target.value;
                  setSteps(newSteps);
                }}
                placeholder={`Popis ${index + 1}. kroku`}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                rows={2}
              />
              <button
                type="button"
                onClick={() => setSteps(steps.filter((_, i) => i !== index))}
                className="flex-shrink-0 text-gray-400 hover:text-red-500 transition p-2"
                title="Smazat krok"
              >
                <IconTrash />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setSteps([...steps, ""])}
            className="bg-blue-100 text-blue-800 hover:bg-blue-200 font-semibold px-4 py-2 rounded-lg text-sm transition"
          >
            ➕ Přidat další krok
          </button>
        </div>
      </div>

      {/* --- ODESLÁNÍ --- */}
      <div className="pt-6 border-t flex justify-end">
        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 rounded-lg transition-transform transform hover:scale-105"
          disabled={submitting || loading}
        >
          {submitting ? "Ukládám..." : submitLabel}
        </button>
      </div>
    </form>
  );
}