"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import useAdmin from "@/hooks/useAdmin";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  calories_per_gram: number | string;
  display?: string | null;
  default_grams?: number;
}

interface Recipe {
  id: number;
  title: string;
  notes?: string;
  image_url?: string;
  categories?: string[];
  ingredients?: Ingredient[];
  meal_types?: string[];
  steps?: string[];
  calories?: number;
}

export default function DetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchRecipe = async () => {
      if (!API_URL) return setErrorMsg("❌ API_URL není definováno."), setLoading(false);
      if (!id || typeof id !== "string") return setErrorMsg("❌ ID receptu není platné."), setLoading(false);

      const numericId = Number(id);
      if (isNaN(numericId)) return setErrorMsg("❌ ID receptu musí být číslo."), setLoading(false);

      try {
        const res = await fetch(`${API_URL}/api/recipes/${numericId}`);
        if (!res.ok) {
          const text = await res.text();
          return setErrorMsg(`❌ Chyba ${res.status}: ${text}`);
        }
        const data: Recipe = await res.json();
        console.log("📦 Načtený recept:", data);
        setRecipe(data);
      } catch {
        setErrorMsg("❌ Nepodařilo se načíst recept.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Opravdu chceš smazat tento recept?")) return;
    try {
      const res = await fetch(`${API_URL}/api/recipes/${recipe?.id}`, {
        method: "DELETE",
        headers: { "x-user-email": localStorage.getItem("userEmail") || "" },
      });
      if (res.ok) {
        alert("✅ Recept smazán");
        router.push("/recepty");
      } else {
        const text = await res.text();
        alert("❌ Chyba při mazání: " + text);
      }
    } catch {
      alert("❌ Neznámá chyba při mazání.");
    }
  };

  const handleEdit = () => router.push(`/recepty/${recipe?.id}/upravit`);

  if (loading) return <p>Načítání...</p>;
  if (errorMsg) return <p className="text-red-600">{errorMsg}</p>;
  if (!recipe) return <p>Recept nenalezen.</p>;

  const imageUrl = recipe.image_url?.startsWith("http") ? recipe.image_url : recipe.image_url ? `${API_URL}${recipe.image_url}` : "/placeholder.jpg";

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold">{recipe.title}</h1>
        {typeof recipe.calories === "number" && <div className="text-sm bg-yellow-100 text-gray-700 px-3 py-1 rounded">{recipe.calories} kcal celkem</div>}
      </div>

      {!!recipe.ingredients?.length && (
        <>
          <h3 className="font-semibold mt-6">Ingredience</h3>
          <ul className="list-disc list-inside mt-2 mb-6">
            {recipe.ingredients.map((ing, i) => {
              const unit = ing.unit ?? "g";
              const amount = Number(ing.amount) || 0;
              const caloriesPerGram = Number(ing.calories_per_gram) || 0;

              let grams = amount;
              let note = "";

              if (unit !== "g" && ing.default_grams) {
                grams = amount * ing.default_grams;
                note = ` (${amount} ${unit} = ${grams} g)`;
              }

              const kcal = Math.round(grams * caloriesPerGram);
              const displayAmount = `${amount} ${unit}`;

              return (
                <li key={i}>
                  {ing.name} – {displayAmount} = {Math.round(grams)} g, {kcal} kcal{note}
                </li>
              );
            })}
          </ul>
        </>
      )}

      <div className="relative w-full h-64 mb-6">
        <Image src={imageUrl} alt={recipe.title} fill unoptimized className="object-cover rounded" />
      </div>

      {!!recipe.steps?.length && (
        <>
          <h3 className="font-semibold mt-4 mb-2">Postup</h3>
          <ol className="space-y-4">
            {recipe.steps.map((step, i) => (
              <li key={i} className="relative border-l-4 border-green-600 pl-6 pr-2 py-3 bg-white rounded shadow-sm">
                <div className="absolute -left-4 top-3 w-7 h-7 bg-green-600 text-white font-bold rounded-full flex items-center justify-center">{i + 1}</div>
                {step}
              </li>
            ))}
          </ol>
        </>
      )}

      {recipe.notes && <p className="mt-6 whitespace-pre-line text-gray-700">{recipe.notes}</p>}

      {!!recipe.categories?.length && (
        <>
          <h3 className="font-semibold mt-6">Kategorie</h3>
          <div className="flex flex-wrap gap-2 text-sm mt-2">
            {recipe.categories.map((cat) => (
              <span key={cat} className="bg-gray-200 px-3 py-1 rounded text-gray-700">
                {cat}
              </span>
            ))}
          </div>
        </>
      )}

      {!adminLoading && isAdmin && (
        <div className="flex gap-4 mt-6">
          <button onClick={handleEdit} className="bg-blue-600 text-white px-4 py-2 rounded">
            Upravit
          </button>
          <button onClick={handleDelete} className="border border-red-600 text-red-600 px-4 py-2 rounded">
            Smazat
          </button>
        </div>
      )}
    </div>
  );
}