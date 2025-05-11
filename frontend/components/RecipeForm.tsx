"use client";

import { useState } from "react";
import CategorySelector from "@/components/CategorySelector";

export type Ingredient = {
  name: string;
  amount: number;
  unit: string;
};

export type RecipeFormProps = {
  initialTitle?: string;
  initialDescription?: string;
  initialImageUrl?: string;
  initialIngredients?: Ingredient[];
  initialCategories?: string[];
  initialMealTypes?: string[]; // ✅ pole
  onSubmit: (formData: FormData) => Promise<void>;
  submitLabel?: string;
};

const MEAL_TYPES = ["Snídaně", "Svačina", "Oběd", "Večeře"];

export default function RecipeForm({
  initialTitle = "",
  initialDescription = "",
  initialImageUrl,
  initialIngredients = [{ name: "", amount: 0, unit: "g" }],
  initialCategories = [],
  initialMealTypes = [],
  onSubmit,
  submitLabel = "Přidat recept",
}: RecipeFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialImageUrl || null);
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients);
  const [categories, setCategories] = useState<string[]>(initialCategories);
  const [mealTypes, setMealTypes] = useState<string[]>(initialMealTypes);
  const [submitting, setSubmitting] = useState(false);

  const handleIngredientChange = (index: number, field: keyof Ingredient, value: string | number) => {
    const updated = [...ingredients];
    updated[index] = {
      ...updated[index],
      [field]: field === "amount" ? Number(value) : String(value),
    };
    setIngredients(updated);
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: "", amount: 0, unit: "g" }]);
  };

  const removeIngredient = (index: number) => {
    const updated = [...ingredients];
    updated.splice(index, 1);
    setIngredients(updated);
  };

  const toggleCategory = (cat: string) => {
    setCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  };

  const toggleMealType = (type: string) => {
    setMealTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("ingredients", JSON.stringify(ingredients));
    formData.append("categories", JSON.stringify(categories));
    formData.append("mealType", JSON.stringify(mealTypes)); // ✅ serialize array

    if (imageFile) formData.append("image", imageFile);

    await onSubmit(formData);
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleFormSubmit} className="max-w-xl mx-auto p-4 space-y-4" encType="multipart/form-data">
      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Název receptu" required className="w-full p-2 border rounded" />

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
          } else if (initialImageUrl) {
            setImagePreview(initialImageUrl);
          }
        }}
        className="w-full p-2 border rounded"
      />

      {imagePreview && <img src={imagePreview} alt="Náhled" className="w-full h-48 object-cover rounded mb-4" />}

      <h3 className="font-semibold">Ingredience</h3>
      {ingredients.map((ing, i) => (
        <div key={i} className="flex gap-2 items-center mb-2">
          <input
            type="text"
            value={ing.name}
            onChange={(e) => handleIngredientChange(i, "name", e.target.value)}
            placeholder="Název"
            className="flex-1 p-2 border rounded"
          />
          <input
            type="number"
            value={ing.amount}
            onChange={(e) => handleIngredientChange(i, "amount", +e.target.value)}
            placeholder="Množství"
            className="w-24 p-2 border rounded"
          />
          <select value={ing.unit} onChange={(e) => handleIngredientChange(i, "unit", e.target.value)} className="w-24 p-2 border rounded">
            <option value="g">g</option>
            <option value="ml">ml</option>
            <option value="ks">ks</option>
          </select>
          {ingredients.length > 1 && (
            <button type="button" onClick={() => removeIngredient(i)} className="text-red-600 hover:underline" title="Odebrat ingredienci">
              🗑️
            </button>
          )}
        </div>
      ))}

      <button type="button" onClick={addIngredient} className="text-blue-600 underline">
        ➕ Přidat ingredienci
      </button>

      <h3 className="font-semibold">Kategorie</h3>
      <CategorySelector selected={categories} onToggle={toggleCategory} />

      <h3 className="font-semibold">Typ jídla</h3>
      <div className="flex gap-2 flex-wrap">
        {MEAL_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => toggleMealType(type)}
            className={`px-3 py-1 rounded-full border text-sm transition-all ${
              mealTypes.includes(type) ? "bg-blue-600 text-white" : "bg-white text-gray-800 border-gray-300 hover:bg-gray-100"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded" disabled={submitting}>
        {submitting ? "Ukládám..." : submitLabel}
      </button>
    </form>
  );
}