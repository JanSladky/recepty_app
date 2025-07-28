"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Recipe = {
  id: number;
  title: string;
  image_url: string;
  meal_types?: string[];
};

export default function ReceptyPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
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
                    <Link 
                        key={recipe.id} 
                        href={`/recepty/${recipe.id}`} 
                        className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden block transform hover:-translate-y-1"
                    >
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
                        
                        {/* --- OPRAVENÁ ČÁST PRO ZOBRAZENÍ VŠECH ZNAČEK --- */}
                        <div className="absolute top-2 right-2 flex flex-wrap gap-1">
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
                    ))}
                </div>
            )}
        </main>
    </div>
  );
}