"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import useAdmin from "@/hooks/useAdmin";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Ingredient = {
  name: string;
  amount: number;
  unit: string;
};

type Recipe = {
  id: number;
  title: string;
  notes: string;
  image_url: string;
  categories: string[];
  ingredients: Ingredient[];
  meal_types?: string[];
  steps?: string[];
  calories: number;
};

export default function DetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAdmin, loading: adminLoading } = useAdmin();

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const res = await fetch(`${API_URL}/api/recipes/${id}`);
        const data = await res.json();

        setRecipe(data);
      } catch (err) {
        console.error("❌ Chyba při načítání detailu receptu:", err);
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
        headers: {
          "x-user-email": localStorage.getItem("userEmail") || "",
        },
      });

      if (res.ok) {
        alert("✅ Recept smazán");
        router.push("/recepty");
      } else {
        const errorText = await res.text();
        console.error("❌ Chyba při mazání receptu:", errorText);
        alert("❌ Chyba při mazání receptu: " + errorText);
      }
    } catch (err) {
      console.error("❌ Neznámá chyba při mazání:", err);
      alert("❌ Chyba při mazání");
    }
  };

  const handleEdit = () => {
    router.push(`/recepty/${recipe?.id}/upravit`);
  };

  if (loading) return <p>Načítání...</p>;
  if (!recipe) return <p>Recept nenalezen</p>;

  const mealTypes = recipe.meal_types ?? [];

  // 🔍 Správné vyhodnocení obrázku
  const imageUrl = recipe.image_url ? (recipe.image_url.startsWith("http") ? recipe.image_url : `${API_URL}${recipe.image_url}`) : "/placeholder.jpg"; // ✅ přímo string, bez importu

  console.log("🖼 Zobrazený obrázek:", imageUrl);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <h1 className="text-3xl font-bold flex-1">{recipe.title}</h1>
          {recipe.calories != null && <div className="text-sm text-gray-700 bg-yellow-100 px-3 py-1 rounded whitespace-nowrap">{recipe.calories} kcal</div>}
        </div>
      </div>

      {mealTypes.length > 0 && (
        <div className="mb-4 text-sm">
          <strong>Typ jídla:</strong>{" "}
          {mealTypes.map((type, i) => (
            <span key={i} className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded mr-2">
              {type}
            </span>
          ))}
        </div>
      )}

      <div className="relative w-full h-64 mb-4">
        <Image
          src={imageUrl}
          alt={recipe.title}
          fill
          unoptimized // ✅ důležité pro obrázky mimo Image CDN
          className="object-cover rounded"
        />
      </div>
      {recipe.steps && recipe.steps.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mt-4 mb-2">Postup</h3>
          <div className="space-y-6">
            {recipe.steps.map((step, i) => (
              <div key={i} className="relative bg-white border-l-4 border-green-500 pl-6 pr-4 py-4 shadow-xl rounded-md">
                <div className="absolute -left-4 top-4 w-8 h-8 bg-green-500 text-white font-bold rounded-full flex items-center justify-center shadow">
                  {i + 1}
                </div>
                <p className="text-gray-800 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      <p className="mb-4">{recipe.notes}</p>

      <h3 className="font-semibold mt-4">Kategorie</h3>
      <div className="flex gap-2 mb-4 flex-wrap text-sm">
        {recipe.categories.map((cat) => (
          <span key={cat} className="bg-gray-200 px-3 py-1 rounded">
            {cat}
          </span>
        ))}
      </div>

      <h3 className="font-semibold mt-4 mb-2">Ingredience</h3>
      <ul className="list-disc list-inside mb-6">
        {recipe.ingredients.map((ing, i) => (
          <li key={i}>{["hrst", "špetka"].includes(ing.unit) ? `${ing.unit} - ${ing.name}` : `${ing.amount} ${ing.unit} -  ${ing.name}`}</li>
        ))}
      </ul>

      {!adminLoading && isAdmin && (
        <div className="flex gap-4">
          <button onClick={handleEdit} className="bg-blue-600 text-white px-4 py-2 rounded">
            Upravit
          </button>
          <button onClick={handleDelete} className="text-red-600 border px-4 py-2 rounded">
            Smazat
          </button>
        </div>
      )}
    </div>
  );
}
