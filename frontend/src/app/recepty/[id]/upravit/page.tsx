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
    notes: string;
    image_url: string;
    ingredients: Ingredient[];
    categories: string[];
    meal_types: string[];
    steps: string[];
    calories?: number;
  } | null>(null);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const res = await fetch(`${API_URL}/api/recipes/${id}`);
        if (!res.ok) {
          throw new Error("Chyba při načítání receptu");
        }
        const data = await res.json();

        setInitialData({
          title: data.title,
          notes: data.notes,
          image_url: data.image_url,
          ingredients: data.ingredients.map((i: Ingredient) => ({
            ...i,
            unit: "g",
          })),
          categories: data.categories,
          meal_types: data.meal_types ?? [],
          steps: data.steps ?? [],
          calories: data.calories,
        });
      } catch (e) {
        console.error("❌ Chyba při načítání receptu:", e);
        alert("Nepodařilo se načíst recept.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id]);

  const handleSubmit = async (formData: FormData) => {
    // 🔍 Debug výpis
    console.log("🧪 Odesílám data:");
    for (const [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    try {
      const res = await fetch(`${API_URL}/api/recipes/${id}`, {
        method: "PUT",
        headers: {
          "x-user-email": localStorage.getItem("userEmail") || "",
        },
        body: formData,
      });

      if (!res.ok) {
        let errorMessage = "Neznámá chyba";
        try {
          const contentType = res.headers.get("Content-Type") || "";
          if (contentType.includes("application/json")) {
            const errorJson = await res.json();
            errorMessage = errorJson?.error || errorJson?.message || JSON.stringify(errorJson);
          } else {
            errorMessage = await res.text();
          }
        } catch (parseErr) {
          console.error("❌ Chyba při parsování odpovědi:", parseErr);
        }

        console.error("❌ Chyba při úpravě:", errorMessage);
        alert(`❌ Chyba při úpravě: ${errorMessage}`);
        return;
      }

      alert("✅ Recept upraven!");
      router.push(`/recepty/${id}`);
    } catch (err) {
      console.error("❌ Chyba při komunikaci:", err);
      alert("❌ Chyba při komunikaci se serverem.");
    }
  };

  if (loading || !initialData) return <p>Načítání...</p>;

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-4">Upravit recept</h1>
      <RecipeForm
        initialTitle={initialData.title}
        initialNotes={initialData.notes}
        initialImageUrl={initialData.image_url}
        initialIngredients={initialData.ingredients}
        initialCategories={initialData.categories}
        initialMealTypes={initialData.meal_types}
        initialSteps={initialData.steps}
        initialCalories={initialData.calories}
        onSubmit={handleSubmit}
        submitLabel="Uložit změny"
      />
    </main>
  );
}
