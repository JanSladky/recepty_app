"use client";

import { useState, useRef, useEffect } from "react";
import CategorySelector from "@/components/CategorySelector";
import MealTypeSelector from "@/components/MealTypeSelector";
import IngredientAutocomplete, { IngredientAutocompleteHandle } from "@/components/IngredientAutocomplete";
import type { Ingredient } from "@/components/IngredientAutocomplete";
import Image from "next/image";

export type RecipeFormProps = {
  initialTitle?: string;
  initialNotes?: string;
  initialImageUrl?: string;
  initialIngredients?: Ingredient[];
  initialCategories?: string[];
  initialMealTypes?: string[];
  initialSteps?: string[];
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
  onSubmit,
  submitLabel = "Přidat recept",
  loading = false,
}: RecipeFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [notes, setNotes] = useState(initialNotes);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialImageUrl || null);
  const [categories, setCategories] = useState<string[]>(initialCategories);
  const [mealTypes, setMealTypes] = useState<string[]>(initialMealTypes);
  const [steps, setSteps] = useState<string[]>(initialSteps && initialSteps.length > 0 ? initialSteps : [""]);
  const [submitting, setSubmitting] = useState(false);
  const [calories, setCalories] = useState<number | "">("");

  const ingredientRef = useRef<IngredientAutocompleteHandle>(null);

  useEffect(() => {
    setImagePreview(initialImageUrl || null);
  }, [initialImageUrl]);

  const toggleCategory = (cat: string) => {
    setCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  };

  const toggleMealType = (type: string) => {
    setMealTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const ingredients: Ingredient[] = ingredientRef.current?.getIngredients() || [];

    const formData = new FormData();
    formData.append("title", title);
    formData.append("notes", notes);
    formData.append("ingredients", JSON.stringify(ingredients));
    formData.append("categories", JSON.stringify(categories));
    formData.append("mealType", JSON.stringify(mealTypes));
    formData.append("steps", JSON.stringify(steps));
    if (calories !== "") {
      formData.append("calories", calories.toString());
    }

    if (imageFile) {
      formData.append("image", imageFile);
      console.log("🖼 Nový obrázek nahrán:", imageFile.name);
    } else {
      formData.append("existingImageUrl", initialImageUrl || "");
      console.log("🖼 Ponechán původní obrázek:", initialImageUrl);
    }

    await onSubmit(formData);
    setSubmitting(false);
  };

  const currentImage = imagePreview || "/placeholder.jpg";

  return (
    <form onSubmit={handleFormSubmit} className="max-w-xl mx-auto p-4 space-y-4" encType="multipart/form-data">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Název receptu"
          required
          className="md:col-span-9 p-2 border rounded w-full"
        />
        <input
          type="number"
          value={calories}
          onChange={(e) => setCalories(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder="Kalorie"
          className="md:col-span-3 p-2 border rounded w-full"
        />
      </div>
      {/* Zvolení typu jídla */}
      <h3 className="font-semibold">Typ jídla</h3>
      <MealTypeSelector selected={mealTypes} onToggle={toggleMealType} />

      {/* Vložení kroku receptu */}
      <div>
        <h3 className="font-semibold mb-2">Postup krok za krokem</h3>
        {steps.map((step, index) => (
          <div key={index} className="flex items-start gap-2 mb-3">
            <div className="min-w-[2rem] h-[2rem] bg-green-600 text-white flex items-center justify-center rounded-full font-bold">{index + 1}</div>
            <textarea
              value={step}
              onChange={(e) => {
                const newSteps = [...steps];
                newSteps[index] = e.target.value;
                setSteps(newSteps);
              }}
              placeholder={`Krok ${index + 1}`}
              required
              className="w-full p-2 border rounded"
            />
            <button
              type="button"
              onClick={() => {
                const newSteps = steps.filter((_, i) => i !== index);
                setSteps(newSteps);
              }}
              className="ml-2 text-red-500"
            >
              🗑
            </button>
          </div>
        ))}

        <button type="button" onClick={() => setSteps([...steps, ""])} className="bg-blue-600 text-white px-3 py-1 rounded">
          ➕ Přidat krok
        </button>
      </div>

      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Další poznámky" className="w-full p-2 border rounded" />

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
        className="w-full p-2 border rounded"
      />

      <div className="relative w-full h-48 mb-4 border rounded overflow-hidden">
        <Image src={currentImage} alt="Náhled obrázku" fill unoptimized onError={() => setImagePreview(null)} className="object-cover" />
      </div>

      <h3 className="font-semibold">Ingredience</h3>
      <IngredientAutocomplete ref={ingredientRef} initialIngredients={initialIngredients} />

      <h3 className="font-semibold">Kategorie</h3>
      <CategorySelector selected={categories} onToggle={toggleCategory} />

      <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded" disabled={submitting || loading}>
        {submitting ? "Ukládám..." : submitLabel}
      </button>
    </form>
  );
}
