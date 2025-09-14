// 📁 frontend/src/app/recepty/[id]/upravit/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import RecipeForm from "@/components/RecipeForm";
import type { IngredientRow } from "@/components/IngredientAutocomplete";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

// Shape, jak přichází ingredience z backendu (detail receptu)
type BackendIng = {
  name: string;
  amount: number;
  unit: string;
  calories_per_gram: number | string;
  display?: string | null;
  default_grams?: number | null;

  // ⬇⬇⬇ DOPLNĚNO
  off_id?: string | null;

  // OFF makra – mohou být null
  energy_kcal_100g?: number | null;
  proteins_100g?: number | null;
  carbs_100g?: number | null;
  sugars_100g?: number | null;
  fat_100g?: number | null;
  saturated_fat_100g?: number | null;
  fiber_100g?: number | null;
  sodium_100g?: number | null;
};

export default function EditPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState<{
    title: string;
    notes: string;
    image_url: string | null;
    ingredients: IngredientRow[];
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

        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await fetch(`${API_URL}/api/recipes/${id}`, { headers });
        if (!res.ok) {
          const txt = await res.text();
          console.error("❌ GET /api/recipes/:id", res.status, txt);
          throw new Error(txt || "Chyba při načítání receptu.");
        }

        const data = await res.json();

        const mappedIngredients: IngredientRow[] = (data.ingredients || []).map((i: BackendIng) => ({
          name: i.name,
          amount: Number(i.amount || 0),
          unit: i.unit || "g",
          calories_per_gram: Number(i.calories_per_gram || 0),
          default_grams:
            i.default_grams === undefined || i.default_grams === null ? undefined : Number(i.default_grams),
          display: i.display ?? undefined,

          // ⬇⬇⬇ DOPLNĚNO – držíme OFF vazbu i při editaci
          off_id: i.off_id ?? undefined,

          // OFF makra (na 100 g)
          energy_kcal_100g: i.energy_kcal_100g ?? null,
          proteins_100g: i.proteins_100g ?? null,
          carbs_100g: i.carbs_100g ?? null,
          sugars_100g: i.sugars_100g ?? null,
          fat_100g: i.fat_100g ?? null,
          saturated_fat_100g: i.saturated_fat_100g ?? null,
          fiber_100g: i.fiber_100g ?? null,
          sodium_100g: i.sodium_100g ?? null,
        }));

        setInitialData({
          title: data.title,
          notes: data.notes ?? "",
          image_url: data.image_url ?? null,
          ingredients: mappedIngredients,
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
        body: formData,
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