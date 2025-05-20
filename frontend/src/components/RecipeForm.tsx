"use client";

import { useState, useRef } from "react";
import CategorySelector from "@/components/CategorySelector";
import MealTypeSelector from "@/components/MealTypeSelector";
import IngredientAutocomplete, { IngredientAutocompleteHandle } from "@/components/IngredientAutocomplete";
import type { Ingredient } from "@/components/IngredientAutocomplete";
import Image from "next/image";
import placeholderImg from "@/public/placeholder.jpg";

export type RecipeFormProps = {
  initialTitle?: string;
  initialDescription?: string;
  initialImageUrl?: string;
  initialIngredients?: Ingredient[];
  initialCategories?: string[];
  initialMealTypes?: string[];
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
  const [submitting, setSubmitting] = useState(false);

  const ingredientRef = useRef<IngredientAutocompleteHandle>(null);

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

    if (imageFile) {
      formData.append("image", imageFile);
      console.log("🖼 Nový obrázek nahrán:", imageFile.name);
    } else if (initialImageUrl) {
      formData.append("existingImageUrl", initialImageUrl);
      console.log("🖼 Ponechán původní obrázek:", initialImageUrl);
    }

    await onSubmit(formData);
    setSubmitting(false);
  };

  const currentImage = imagePreview || placeholderImg;

  return (
    <form onSubmit={handleFormSubmit} className="max-w-xl mx-auto p-4 space-y-4" encType="multipart/form-data">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Název receptu"
        required
        className="w-full p-2 border rounded"
      />

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Popis"
        required
        className="w-full p-2 border rounded"
      />

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
        <Image
          src={currentImage}
          alt="Náhled obrázku"
          fill
          unoptimized
          onError={() => setImagePreview(null)}
          className="object-cover"
        />
      </div>

      <h3 className="font-semibold">Ingredience</h3>
      <IngredientAutocomplete ref={ingredientRef} initialIngredients={initialIngredients} />

      <h3 className="font-semibold">Kategorie</h3>
      <CategorySelector selected={categories} onToggle={toggleCategory} />

      <h3 className="font-semibold">Typ jídla</h3>
      <MealTypeSelector selected={mealTypes} onToggle={toggleMealType} />

      <button
        type="submit"
        className="bg-green-600 text-white px-4 py-2 rounded"
        disabled={submitting || loading}
      >
        {submitting ? "Ukládám..." : submitLabel}
      </button>
    </form>
  );
}