// 📁 frontend/src/app/recepty/[id]/upravit/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import RecipeForm from "@/components/RecipeForm";
import type { IngredientRow } from "@/components/IngredientAutocomplete";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5050";

/* ---------- Typy z backendu (volnější) ---------- */
type ServingPreset = {
  label: string;
  grams: number;
  unit?: string;
  inflect?: { one?: string; few?: string; many?: string };
};

type BackendIng = {
  id?: number | string | null;
  ingredient_id?: number | string | null;

  name: string;
  amount: number | string;
  unit: string;
  calories_per_gram: number | string;

  display?: string | null;
  default_grams?: number | string | null;

  // může přijít i tohle z detailu receptu
  selectedServingGrams?: number | string | null;

  // presety mohou přijít v obou tvarech
  serving_presets?: ServingPreset[] | null;
  servingPresets?: ServingPreset[] | null;

  // doplňky
  name_genitive?: string | null;
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

type BackendRecipe = {
  title: string;
  notes?: string | null;
  image_url?: string | null;
  ingredients?: BackendIng[];
  categories?: string[];
  meal_types?: string[];
  steps?: string[];
  calories?: number;
};

/* ---------- Helpers ---------- */
const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const getIngredientId = (ing: BackendIng): number | undefined => {
  const raw = ing.ingredient_id ?? ing.id ?? null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
};

// dofetch doplňků pro ingredienci (presety, default_grams, name_genitive)
async function fetchIngredientExtras(id: number) {
  try {
    const res = await fetch(`${API_URL}/api/ingredients/${id}?format=full`);
    if (!res.ok) return null;
    const j = await res.json();

    const presets: ServingPreset[] =
      (Array.isArray(j.serving_presets) ? j.serving_presets : []) ||
      (Array.isArray(j.servingPresets) ? j.servingPresets : []) ||
      [];

    return {
      servingPresets: presets,
      default_grams: j.default_grams ?? null,
      name_genitive: j.name_genitive ?? null,
    };
  } catch {
    return null;
  }
}

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

        const data: BackendRecipe = await res.json();

        // Hydratace ingrediencí: doplň presety/default_grams/name_genitive pokud chybí
        const mappedIngredients: IngredientRow[] = await Promise.all(
          (data.ingredients || []).map(async (i: BackendIng) => {
            const iid = getIngredientId(i);

            const hasPresets =
              (Array.isArray(i.servingPresets) && i.servingPresets.length > 0) ||
              (Array.isArray(i.serving_presets) && i.serving_presets.length > 0);

            let servingPresets: ServingPreset[] | undefined = undefined;
            let default_grams: number | undefined = undefined;
            let name_genitive: string | undefined = undefined;

            if (hasPresets) {
              servingPresets = (i.servingPresets ?? i.serving_presets ?? undefined) || undefined;
              default_grams = i.default_grams == null ? undefined : num(i.default_grams) || undefined;
              name_genitive = i.name_genitive ?? undefined;
            } else if (iid) {
              const extra = await fetchIngredientExtras(iid);
              if (extra) {
                servingPresets = extra.servingPresets ?? undefined;
                // pokud přišlo z receptu číslo, má přednost
                default_grams =
                  i.default_grams == null
                    ? extra.default_grams == null
                      ? undefined
                      : num(extra.default_grams) || undefined
                    : num(i.default_grams) || undefined;
                name_genitive = i.name_genitive ?? extra.name_genitive ?? undefined;
              }
            } else {
              // bez ID – ber aspoň to, co přišlo
              servingPresets = (i.servingPresets ?? i.serving_presets ?? undefined) || undefined;
              default_grams = i.default_grams == null ? undefined : num(i.default_grams) || undefined;
              name_genitive = i.name_genitive ?? undefined;
            }

            // vybraná porce pro 'ks', pokud byla uložená
            const selectedServingGrams =
              i.selectedServingGrams == null ? undefined : num(i.selectedServingGrams) || undefined;

            const row: IngredientRow & {
              servingPresets?: ServingPreset[];
              selectedServingGrams?: number;
              name_genitive?: string | null;
              off_id?: string;
            } = {
              name: i.name,
              amount: num(i.amount),
              unit: i.unit || "g",
              calories_per_gram: num(i.calories_per_gram),

              display: i.display ?? undefined,
              default_grams,
              // předáme i vybraný preset, pokud existuje
              selectedServingGrams,

              // sjednoceně camelCase, IngredientAutocomplete/RecipeForm si to umí vzít
              servingPresets,

              // doplňky pro labely
              name_genitive: name_genitive ?? null,

              // držíme OFF vazbu i při editaci
              off_id: i.off_id ?? undefined,

              // OFF makra (na 100 g) – jen přepošleme dál
              energy_kcal_100g: i.energy_kcal_100g ?? null,
              proteins_100g: i.proteins_100g ?? null,
              carbs_100g: i.carbs_100g ?? null,
              sugars_100g: i.sugars_100g ?? null,
              fat_100g: i.fat_100g ?? null,
              saturated_fat_100g: i.saturated_fat_100g ?? null,
              fiber_100g: i.fiber_100g ?? null,
              sodium_100g: i.sodium_100g ?? null,
            };

            return row;
          })
        );

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