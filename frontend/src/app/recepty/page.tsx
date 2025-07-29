"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// --- Helper Icon ---
const IconHeart = ({ isFavorite }: { isFavorite: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-all duration-200 ${isFavorite ? 'text-red-500' : 'text-white'}`}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
);

type Recipe = {
  id: number;
  title: string;
  image_url: string;
  meal_types?: string[];
};

export default function ReceptyPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // Načteme email a oblíbené, jakmile se stránka načte na klientovi
    const email = localStorage.getItem("userEmail");
    setUserEmail(email);
    if (email) {
      fetchFavorites(email);
    }
  }, []);

  const fetchFavorites = async (email: string) => {
    try {
      const res = await fetch(`${API_URL}/api/user/favorites`, {
        headers: { "x-user-email": email },
      });
      if (res.ok) {
        const data = await res.json();
        setFavoriteIds(data.favoriteIds || []);
      }
    } catch (error) {
      console.error("Chyba při načítání oblíbených:", error);
    }
  };

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/recipes`);
        const data = await res.json();
        setRecipes(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("❌ Chyba při načítání receptů:", error);
        setRecipes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRecipes();
  }, []);

  const handleToggleFavorite = async (recipeId: number) => {
      if (!userEmail) {
          alert("Pro přidání do oblíbených se musíte přihlásit.");
          return;
      }
      
      // Okamžitá vizuální odezva
      setFavoriteIds(prev => 
        prev.includes(recipeId) 
            ? prev.filter(id => id !== recipeId) 
            : [...prev, recipeId]
      );

      try {
          await fetch(`${API_URL}/api/user/favorites/${recipeId}`, {
              method: 'POST',
              headers: { "x-user-email": userEmail },
          });
      } catch (error) {
          console.error("Chyba při přepínání oblíbených:", error);
          // Vrátíme zpět v případě chyby
          setFavoriteIds(prev => 
            prev.includes(recipeId) 
                ? prev.filter(id => id !== recipeId) 
                : [...prev, recipeId]
          );
          alert("Akce se nezdařila, zkuste to prosím znovu.");
      }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-4xl sm:text-5xl font-bold text-gray-800">Všechny recepty</h1>
                <p className="text-lg text-gray-500 mt-2">Prohlížej si naši kompletní sbírku.</p>
            </div>

            {loading ? (
                <p className="text-center text-gray-500">Načítám recepty...</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {recipes.map((recipe) => (
                    <div key={recipe.id} className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden block transform hover:-translate-y-1 relative">
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
                        {/* Tlačítko pro oblíbené */}
                        {userEmail && (
                            <button 
                                onClick={(e) => {
                                    e.preventDefault(); // Zabrání přechodu na detail
                                    handleToggleFavorite(recipe.id);
                                }}
                                className="absolute top-2 left-2 bg-black/30 backdrop-blur-sm p-2 rounded-full hover:bg-black/50 transition z-10"
                                aria-label="Přidat do oblíbených"
                            >
                                <IconHeart isFavorite={favoriteIds.includes(recipe.id)} />
                            </button>
                        )}
                    </div>
                    ))}
                </div>
            )}
        </main>
    </div>
  );
}