"use client";

import { useState, useRef, useEffect } from "react";
import CategorySelector from "@/components/CategorySelector";
import MealTypeSelector from "@/components/MealTypeSelector";
import IngredientAutocomplete, { IngredientAutocompleteHandle } from "@/components/IngredientAutocomplete";
import type { Ingredient } from "@/components/IngredientAutocomplete";
import Image from "next/image";

export type RecipeFormProps = {
  initialTitle?: string;
  initialDescription?: string;
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
  initialDescription = "",
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
  const [description, setDescription] = useState(initialDescription);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialImageUrl || null);
  const [categories, setCategories] = useState<string[]>(initialCategories);
  const [mealTypes, setMealTypes] = useState<string[]>(initialMealTypes);
  const [steps, setSteps] = useState<string[]>(initialSteps && initialSteps.length > 0 ? initialSteps : [""]);
  const [submitting, setSubmitting] = useState(false);

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
    formData.append("description", description);
    formData.append("ingredients", JSON.stringify(ingredients));
    formData.append("categories", JSON.stringify(categories));
    formData.append("mealType", JSON.stringify(mealTypes));
    formData.append("steps", JSON.stringify(steps));

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
      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Název receptu" required className="w-full p-2 border rounded" />
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

      <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Popis" required className="w-full p-2 border rounded" />

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
