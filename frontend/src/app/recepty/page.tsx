"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const IconHeart = ({ isFavorite }: { isFavorite: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill={isFavorite ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`transition-all duration-200 ${isFavorite ? "text-red-500" : "text-white"}`}
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
  </svg>
);

type Recipe = {
  id: number;
  title: string;
  image_url: string;
  meal_types?: string[];
};

export default function ReceptyPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchData = async () => {
      try {
        setLoading(true);

        // 1️⃣ Načti recepty
        const recipesRes = await fetch(`${API_URL}/api/recipes`);
        const recipesData = await recipesRes.json();
        setRecipes(Array.isArray(recipesData) ? recipesData : []);

        // 2️⃣ Pokud přihlášený, načti oblíbené
        if (token) {
          const favRes = await fetch(`${API_URL}/api/user/favorites`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (favRes.ok) {
            const favData = await favRes.json();
            console.log("💾 Backend poslal:", favData);
            setFavoriteIds(Array.isArray(favData) ? favData.map((r: { id: number }) => r.id) : []);
          }
        }
      } catch (error) {
        console.error("❌ Chyba při načítání dat:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleToggleFavorite = async (recipeId: number) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Musíte být přihlášen");
      return;
    }

    const isFav = favoriteIds.includes(recipeId);
    setFavoriteIds((prev) => (isFav ? prev.filter((id) => id !== recipeId) : [...prev, recipeId]));

    try {
      const res = await fetch(`${API_URL}/api/user/favorites/${recipeId}/toggle`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Neúspěšné uložení");
      }
    } catch (error) {
      console.error("❌ Chyba při uložení oblíbeného:", error);
      // Vrátíme zpět stav
      setFavoriteIds((prev) => (isFav ? [...prev, recipeId] : prev.filter((id) => id !== recipeId)));
    }
  };

  console.log("🔁 Načtené oblíbené ID:", favoriteIds);

  return (
    <div className="bg-gray-50 min-h-screen">
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Všechny recepty</h1>
          <p className="text-lg text-gray-500 mt-2">Prohlížej si naši kompletní sbírku.</p>
        </div>

        {loading ? (
          <p className="text-center text-gray-500">Načítám recepty...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {recipes.map((recipe) => {
              const isFavorite = favoriteIds.includes(recipe.id);
              return (
                <div
                  key={recipe.id}
                  className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden block transform hover:-translate-y-1 relative"
                >
                  <Link href={`/recepty/${recipe.id}`}>
                    <div className="relative w-full h-48">
                      <Image
                        src={
                          recipe.image_url && recipe.image_url.startsWith("http")
                            ? recipe.image_url
                            : recipe.image_url
                            ? `${API_URL ?? ""}${recipe.image_url}`
                            : "/placeholder.jpg"
                        }
                        alt={recipe.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      <div className="absolute top-2 right-2 flex flex-wrap-reverse gap-1">
                        {recipe.meal_types?.map((type) => (
                          <span key={type} className="bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="p-4">
                      <h2 className="text-lg font-bold text-gray-800 truncate group-hover:text-green-600 transition-colors">{recipe.title}</h2>
                    </div>
                  </Link>

                  {localStorage.getItem("token") && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleToggleFavorite(recipe.id);
                      }}
                      className="absolute top-2 left-2 bg-black/30 backdrop-blur-sm p-2 rounded-full hover:bg-black/50 transition z-10"
                      aria-label="Přidat do oblíbených"
                    >
                      <IconHeart isFavorite={isFavorite} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
