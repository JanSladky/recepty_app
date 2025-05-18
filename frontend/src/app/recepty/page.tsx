"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Recipe = {
  id: number;
  title: string;
  image_url: string;
};

export default function ReceptyPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const res = await fetch(`${API_URL}/api/recipes`);
        const data = await res.json();
        console.log("🧪 API odpověď:", data);

        setRecipes(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("❌ Chyba při načítání receptů:", error);
        setRecipes([]);
      }
    };
    fetchRecipes();
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Recepty</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {recipes.map((recipe) => (
          <Link
            key={recipe.id}
            href={`/recepty/${recipe.id}`}
            className="border rounded shadow hover:shadow-lg transition overflow-hidden block"
          >
            <div className="relative w-full h-48">
              <Image
                src={recipe.image_url ? `${API_URL}${recipe.image_url}` : "/placeholder.jpg"}
                alt={recipe.title}
                fill
                className="object-cover"
                priority
              />
            </div>
            <div className="p-4">
              <h2 className="text-xl font-semibold">{recipe.title}</h2>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}