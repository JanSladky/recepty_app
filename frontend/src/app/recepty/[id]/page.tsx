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
  description: string;
  image_url: string;
  categories: string[];
  ingredients: Ingredient[];
  meal_types?: string[];
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
        console.error("Chyba při načítání detailu receptu:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id]);

  const handleDelete = async () => {
    if (confirm("Opravdu chceš smazat tento recept?")) {
      await fetch(`${API_URL}/api/recipes/${recipe?.id}`, {
        method: "DELETE",
        headers: {
          "x-user-email": localStorage.getItem("email") || "",
        },
      });
      alert("Recept smazán");
      router.push("/recepty");
    }
  };

  const handleEdit = () => {
    router.push(`/recepty/${recipe?.id}/upravit`);
  };

  if (loading) return <p>Načítání...</p>;
  if (!recipe) return <p>Recept nenalezen</p>;

  const mealTypes = recipe.meal_types ?? [];

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">{recipe.title}</h1>

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
          src={
            recipe.image_url?.startsWith("http")
              ? recipe.image_url
              : recipe.image_url
              ? `${API_URL}${recipe.image_url}`
              : "/placeholder.jpg"
          }
          alt={recipe.title}
          fill
          className="object-cover rounded"
        />
      </div>

      <p className="mb-4">{recipe.description}</p>

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
          <li key={i}>
            {ing.amount} {ing.unit} {ing.name}
          </li>
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