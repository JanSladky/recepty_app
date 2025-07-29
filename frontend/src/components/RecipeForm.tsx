"use client";

import { useState, useRef, useEffect } from "react";
import CategorySelector from "@/components/CategorySelector";
import MealTypeSelector from "@/components/MealTypeSelector";
import IngredientAutocomplete, { IngredientAutocompleteHandle, Ingredient } from "@/components/IngredientAutocomplete";
import Image from "next/image";

// Helper icon component for UI elements
const IconTrash = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-trash-2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
);

export type RecipeFormProps = {
  initialTitle?: string;
  initialNotes?: string;
  initialImageUrl?: string;
  initialIngredients?: Ingredient[];
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
  initialImageUrl,
  initialCategories = [],
  initialMealTypes = [],
  initialSteps = [],
  initialCalories = undefined,
  onSubmit,
  submitLabel = "Přidat recept",
  loading = false,
}: RecipeFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialImageUrl || null);
  const [categories, setCategories] = useState<string[]>(initialCategories);
  const [mealTypes, setMealTypes] = useState<string[]>(initialMealTypes ?? []);
  const [steps, setSteps] = useState<string[]>(initialSteps.length ? initialSteps : [""]);
  const [submitting, setSubmitting] = useState(false);
  const [calories, setCalories] = useState<number>(initialCalories ?? NaN);

  const ingredientRef = useRef<IngredientAutocompleteHandle>(null);

  useEffect(() => {
    setImagePreview(initialImageUrl || null);
  }, [initialImageUrl]);

  useEffect(() => {
    if (ingredientRef.current && initialIngredients.length > 0) {
      ingredientRef.current.setInitialIngredients(initialIngredients);
    }
  }, [initialIngredients]);

  const toggleCategory = (cat: string) => {
    setCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  };

  const toggleMealType = (type: string) => {
    setMealTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const ingredients = ingredientRef.current?.getIngredients() || [];
        const total = ingredients.reduce((sum, ing) => {
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
        setCalories(Math.round(total));
      } catch (err) {
        console.error("Chyba při výpočtu kalorií:", err);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const rawIngredients = ingredientRef.current?.getIngredients() || [];

    if (rawIngredients.length === 0) {
      alert("Musíš zadat alespoň jednu surovinu.");
      setSubmitting(false);
      return;
    }

    const ingredients: Ingredient[] = rawIngredients.map((ing) => ({
      ...ing,
      calories_per_gram: Number(ing.calories_per_gram),
    }));

    const formData = new FormData();
    formData.append("title", title);
    const cleanedNotes = typeof notes === "string" ? notes.trim() : "";
    if (cleanedNotes) {
      formData.append("notes", cleanedNotes);
    }
    formData.append("ingredients", JSON.stringify(ingredients));
    formData.append("categories", JSON.stringify(categories));
    formData.append("mealTypes", JSON.stringify(mealTypes));
    formData.append("steps", JSON.stringify(steps.filter(s => s.trim() !== "")));
    if (Number.isFinite(calories)) {
      formData.append("calories", calories.toString());
    }

    if (imageFile instanceof File) {
      formData.append("image", imageFile);
    } else if (initialImageUrl) {
      formData.append("existingImageUrl", initialImageUrl);
    }

    const userEmail = localStorage.getItem("userEmail");
    if (userEmail) {
        formData.append("userEmail", userEmail);
    }

    await onSubmit(formData);
    setSubmitting(false);
  };

  const currentImage = imagePreview || "/placeholder.jpg";

  return (
    <form onSubmit={handleFormSubmit} className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg space-y-8 max-w-4xl mx-auto" encType="multipart/form-data">
        
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
        
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Krátký popis nebo poznámky k receptu..." className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition" rows={3}/>

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
                    <Image src={currentImage} alt="Náhled obrázku" fill unoptimized onError={() => setImagePreview(null)} className="object-cover" />
                </div>
            </div>
        </div>
      
        {/* --- INGREDIENCE --- */}
        <div className="pt-6 border-t">
            <h2 className="text-2xl font-bold text-gray-800">Ingredience</h2>
            <p className="text-gray-500 text-sm mt-1">Přidej všechny potřebné suroviny a jejich množství.</p>
            <div className="mt-4">
                <IngredientAutocomplete ref={ingredientRef} initialIngredients={initialIngredients} />
            </div>
        </div>

        {/* --- POSTUP --- */}
        <div className="pt-6 border-t">
            <h2 className="text-2xl font-bold text-gray-800">Postup</h2>
            <p className="text-gray-500 text-sm mt-1">Popiš jednotlivé kroky přípravy.</p>
            <div className="mt-4 space-y-4">
                {steps.map((step, index) => (
                <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white flex items-center justify-center rounded-full font-bold text-sm">{index + 1}</div>
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
                    <button type="button" onClick={() => setSteps(steps.filter((_, i) => i !== index))} className="flex-shrink-0 text-gray-400 hover:text-red-500 transition p-2">
                        <IconTrash />
                    </button>
                </div>
                ))}
                <button type="button" onClick={() => setSteps([...steps, ""])} className="bg-blue-100 text-blue-800 hover:bg-blue-200 font-semibold px-4 py-2 rounded-lg text-sm transition">
                ➕ Přidat další krok
                </button>
            </div>
        </div>

        {/* --- ODESLÁNÍ --- */}
        <div className="pt-6 border-t flex justify-end">
            <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 rounded-lg transition-transform transform hover:scale-105" disabled={submitting || loading}>
                {submitting ? "Ukládám..." : submitLabel}
            </button>
        </div>
    </form>
  );
}