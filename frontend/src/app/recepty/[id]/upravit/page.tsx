"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import RecipeForm from "@/components/RecipeForm";
import type { Ingredient } from "@/components/IngredientAutocomplete";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function EditPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState<{
    title: string;
    description: string;
    image_url: string;
    ingredients: Ingredient[];
    categories: string[];
    meal_types: string[];
  } | null>(null);

  useEffect(() => {
    const fetchRecipe = async () => {
      const res = await fetch(`${API_URL}/api/recipes/${id}`);
      const data = await res.json();
      setInitialData({
        title: data.title,
        description: data.description,
        image_url: data.image_url,
        ingredients: data.ingredients,
        categories: data.categories,
        meal_types: data.meal_types ?? [],
      });
      setLoading(false);
    };
    fetchRecipe();
  }, [id]);

  const handleSubmit = async (formData: FormData) => {
    try {
      const res = await fetch(`${API_URL}/api/recipes/${id}`, {
        method: "PUT",
        headers: {
          // důležité: ne nastavuj Content-Type při použití FormData!
          "x-user-email": localStorage.getItem("userEmail") || "",
        },
        body: formData,
      });

      if (res.ok) {
        alert("✅ Recept upraven!");
        router.push(`/recepty/${id}`);
      } else if (res.status === 401) {
        alert("❌ Nemáš oprávnění upravit recept.");
      } else {
        alert("❌ Chyba při úpravě.");
      }
    } catch (err) {
      console.error("❌ Chyba při odesílání požadavku:", err);
      alert("❌ Chyba při komunikaci se serverem.");
    }
  };

  if (loading || !initialData) return <p>Načítání...</p>;

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-4">Upravit recept</h1>
      <RecipeForm
        initialTitle={initialData.title}
        initialDescription={initialData.description}
        initialImageUrl={initialData.image_url}
        initialIngredients={initialData.ingredients}
        initialCategories={initialData.categories}
        initialMealTypes={initialData.meal_types}
        onSubmit={handleSubmit}
        submitLabel="Uložit změny"
      />
    </main>
  );
}