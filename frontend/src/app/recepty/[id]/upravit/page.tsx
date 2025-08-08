// 📁 frontend/src/app/recepty/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import RecipeForm from "@/components/RecipeForm";
import type { Ingredient } from "@/components/IngredientAutocomplete";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

interface FullIngredient {
  id: number;
  name: string;
  amount: number;
  unit: string;
  calories_per_gram: number;
  category_id: number;
  category_name: string;
  default_grams?: number;
  display?: string;
}

export default function EditPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
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
      if (!id) return;

      try {
        setLoading(true);

        // 🔐 PŘIDEJ TOKEN — jinak PENDING/REJECTED vrátí 404
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await fetch(`${API_URL}/api/recipes/${id}`, { headers });
        if (!res.ok) {
          const txt = await res.text();
          console.error("❌ GET /api/recipes/:id", res.status, txt);
          throw new Error(txt || "Chyba při načítání receptu.");
        }

        const data = await res.json();

        setInitialData({
          title: data.title,
          notes: data.notes,
          image_url: data.image_url,
          ingredients: (data.ingredients || []).map((i: FullIngredient) => ({
            id: i.id,
            name: i.name,
            amount: i.amount,
            unit: i.unit || "",
            calories_per_gram: i.calories_per_gram,
            category_id: i.category_id,
            category_name: i.category_name,
            default_grams: i.default_grams,
            display: i.display,
          })),
          categories: data.categories || [],
          meal_types: data.meal_types ?? [],
          steps: data.steps ?? [],
          calories: data.calories,
        });
      } catch (e) {
        console.error("❌ Chyba při načítání receptu:", e);
        alert("Nepodařilo se načíst recept. Jste přihlášen/a a máte práva?");
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id]);

  const handleSubmit = async (formData: FormData) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Nejste přihlášen. Přihlaste se prosím znovu.");
        router.push("/login");
        return;
      }

      const res = await fetch(`${API_URL}/api/recipes/${id}`, {
        method: "PUT",
        body: formData, // boundary nastaví prohlížeč sám
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const clone = res.clone();
        try {
          const json = await res.json();
          throw new Error(json.message || json.error || "Neznámá chyba serveru.");
        } catch {
          const text = await clone.text();
          throw new Error(text || `Chyba serveru: ${res.status}`);
        }
      }

      alert("✅ Recept upraven!");
      router.push(`/recepty/${id}`);
      router.refresh();
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