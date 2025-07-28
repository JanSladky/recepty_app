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
        if (!res.ok) throw new Error("Chyba při načítání receptu");
        const data = await res.json();

        setInitialData({
          title: data.title,
          notes: data.notes,
          image_url: data.image_url,
          ingredients: data.ingredients.map((i: Ingredient) => ({
            ...i,
            unit: i.unit,
            default_grams: i.default_grams,
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
    try {
      // Email se nyní přidává do formData uvnitř komponenty RecipeForm.
      // Zde NESMÍME nastavovat ŽÁDNÉ hlavičky, aby si je prohlížeč mohl
      // nastavit automaticky pro správné nahrání souboru.
      const res = await fetch(`${API_URL}/api/recipes/${id}`, {
        method: "PUT",
        body: formData, // Žádný 'headers' objekt!
      });

      if (!res.ok) {
        // Zkusíme přečíst odpověď jako JSON pro detailnější chybu
        try {
            const errorData = await res.json();
            throw new Error(errorData.error || "Neznámá chyba serveru");
        } catch (jsonError) {
            // Pokud odpověď není JSON, vypíšeme ji jako text
            const errorText = await res.text();
            throw new Error(errorText || `Chyba serveru: ${res.status}`);
        }
      }

      alert("✅ Recept upraven!");
      router.push(`/recepty/${id}`);
      router.refresh(); // Zajistí znovunačtení dat na stránce s detailem
    } catch (err) {
      console.error("❌ Chyba při úpravě:", err);
      alert(`❌ Chyba při úpravě: ${(err as Error).message}`);
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