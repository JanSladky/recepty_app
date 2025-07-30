"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const IconHeart = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-red-500"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
  </svg>
);

type Recipe = {
  id: number;
  title: string;
  image_url: string;
};

export default function FavoritesPage() {
  const [favoriteRecipes, setFavoriteRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    setIsAuthenticated(true);

    const fetchFavorites = async () => {
      try {
        const res = await fetch(`${API_URL}/api/user/favorites`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const contentType = res.headers.get("content-type");
        if (!contentType?.includes("application/json")) {
          throw new Error("Server vrátil neočekávanou odpověď.");
        }

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message || "Chyba při načítání.");
        }

        setFavoriteRecipes(data || []);
      } catch (error) {
        console.error("Chyba při načítání oblíbených:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  const handleRemoveFavorite = async (recipeId: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const original = [...favoriteRecipes];
    setFavoriteRecipes((prev) => prev.filter((r) => r.id !== recipeId));

    try {
      const res = await fetch(`${API_URL}/api/user/favorites/${recipeId}/toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Chyba při mazání z oblíbených.");
      }
    } catch (error) {
      console.error("Chyba při mazání z oblíbených:", error);
      setFavoriteRecipes(original);
      alert("Odebrání se nezdařilo, zkuste to prosím znovu.");
    }
  };

  if (loading) return <p className="text-center p-10">Načítání...</p>;

  if (!isAuthenticated) {
    return (
      <div className="text-center p-10">
        <h1 className="text-2xl font-bold text-gray-800">Přístup odepřen</h1>
        <p className="text-gray-500 mt-2">Pro zobrazení této stránky se musíte přihlásit.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-800">Moje oblíbené recepty</h1>
          <p className="text-lg text-gray-500 mt-2">Tvoje uložené recepty na jednom místě.</p>
        </div>

        {favoriteRecipes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {favoriteRecipes.map((recipe) => (
              <div
                key={recipe.id}
                className="group block bg-white p-4 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative"
              >
                <Link href={`/recepty/${recipe.id}`}>
                  <div className="relative w-full h-48 rounded-xl overflow-hidden">
                    <Image
                      src={recipe.image_url?.startsWith("http") ? recipe.image_url : `${API_URL}${recipe.image_url}`}
                      alt={recipe.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mt-4 truncate">{recipe.title}</h3>
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleRemoveFavorite(recipe.id);
                  }}
                  className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm p-2 rounded-full hover:bg-white transition z-10"
                  aria-label="Odebrat z oblíbených"
                >
                  <IconHeart />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 mt-10">Zatím nemáš žádné oblíbené recepty.</p>
        )}
      </main>
    </div>
  );
}
