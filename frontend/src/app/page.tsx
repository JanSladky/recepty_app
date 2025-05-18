"use client";

import { useState, useEffect } from "react";
import SearchBar from "@/components/SearchBar";
import Link from "next/link";
import Image from "next/image";
import { CUISINE_CATEGORIES, MEALTYPE_CATEGORIES, ALL_MEAL_TYPES } from "@/constants/categories";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Recipe = {
  id: number;
  title: string;
  image_url: string;
  categories: string[];
  meal_types?: string[];
};

const normalizeText = (text: string): string =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState<string[]>([]);
  const [selectedMealTypes, setSelectedMealTypes] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [showCuisine, setShowCuisine] = useState(false);
  const [showMealTypes, setShowMealTypes] = useState(false);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const res = await fetch(`${API_URL}/api/recipes`);
        const data = await res.json();
        setRecipes(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("❌ Chyba při načítání receptů:", error);
        setRecipes([]);
      }
    };
    fetchRecipes();
  }, []);

  useEffect(() => {
    const filtered = recipes.filter((recipe) => {
      const matchesQuery = normalizeText(recipe.title).includes(normalizeText(query));
      const matchesCuisine = selectedCuisine.length === 0 || selectedCuisine.some((c) => recipe.categories.includes(c));
      const matchesMealType = selectedMealTypes.length === 0 || (recipe.meal_types ?? []).some((t) => selectedMealTypes.includes(t));
      return matchesQuery && matchesCuisine && matchesMealType;
    });
    setFilteredRecipes(filtered);
  }, [query, selectedCuisine, selectedMealTypes, recipes]);

  const toggleCuisine = (type: string) => {
    setSelectedCuisine((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  };

  const toggleMealType = (type: string) => {
    setSelectedMealTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  };

  const hasFiltersOrQuery = query || selectedCuisine.length > 0 || selectedMealTypes.length > 0;

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Aplikace na recepty</h1>
      <SearchBar query={query} onQueryChange={setQuery} />
      {/* Filtrovací tlačítka pro typy jídel */}
      <div className="flex flex-wrap gap-2 mb-4">
        {ALL_MEAL_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => toggleMealType(type)}
            className={`px-4 py-1 rounded-full border text-sm transition ${
              selectedMealTypes.includes(type) ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <div>
          <button onClick={() => setShowCuisine(!showCuisine)} className="w-full text-left font-semibold text-gray-700 bg-gray-100 px-4 py-2 rounded-md">
            Typ kuchyně {showCuisine ? "▲" : "▼"}
          </button>
          {showCuisine && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
              {CUISINE_CATEGORIES.map((type) => (
                <label key={type} className="inline-flex items-center">
                  <input type="checkbox" checked={selectedCuisine.includes(type)} onChange={() => toggleCuisine(type)} className="mr-2" />
                  {type}
                </label>
              ))}
            </div>
          )}
        </div>

        <div>
          <button onClick={() => setShowMealTypes(!showMealTypes)} className="w-full text-left font-semibold text-gray-700 bg-gray-100 px-4 py-2 rounded-md">
            Typ jídla {showMealTypes ? "▲" : "▼"}
          </button>
          {showMealTypes && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
              {MEALTYPE_CATEGORIES.map((type) => (
                <label key={type} className="inline-flex items-center">
                  <input type="checkbox" checked={selectedMealTypes.includes(type)} onChange={() => toggleMealType(type)} className="mr-2" />
                  {type}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {hasFiltersOrQuery ? (
        filteredRecipes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-6">
            {filteredRecipes.map((recipe) => (
              <Link key={recipe.id} href={`/recepty/${recipe.id}`} className="border rounded shadow hover:shadow-lg transition overflow-hidden block">
                <div className="relative w-full h-48">
                  <Image
                    src={
                      recipe.image_url && recipe.image_url.startsWith("http")
                        ? recipe.image_url
                        : recipe.image_url
                        ? `${API_URL}${recipe.image_url}`
                        : "/placeholder.jpg"
                    }
                    alt={recipe.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <h2 className="text-xl font-semibold">{recipe.title}</h2>
                  {recipe.meal_types && recipe.meal_types.length > 0 && <p className="text-sm text-gray-500">{recipe.meal_types.join(", ")}</p>}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-6 text-gray-500">Žádné recepty neodpovídají hledání.</p>
        )
      ) : (
        <p className="mt-6 text-gray-500">Zadej název receptu nebo vyber filtr pro zobrazení výsledků.</p>
      )}
    </main>
  );
}
