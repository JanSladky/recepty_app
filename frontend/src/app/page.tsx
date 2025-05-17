"use client";

import { useState, useEffect } from "react";
import SearchBar from "@/components/SearchBar";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const CUISINE_TYPES = ["Italská", "Česká", "Asijská", "Mexická", "Indická", "Japonská", "Americká"];

const INGREDIENT_TYPES = ["Maso", "Ryby", "Mořské plody", "Smažený sýr", "Sendviče", "Těstoviny"];

type Recipe = {
  id: number;
  title: string;
  image_url: string;
  categories: string[];
  meal_types?: string[];
};

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState<string[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [showCuisine, setShowCuisine] = useState(false);
  const [showIngredients, setShowIngredients] = useState(false);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        console.log("🔍 Volání API:", `${API_URL}/api/recipes`);
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
      const matchesQuery = recipe.title.toLowerCase().includes(query.toLowerCase());
      const matchesCuisine = selectedCuisine.length === 0 || selectedCuisine.some((c) => recipe.categories.includes(c));
      const matchesIngredients = selectedIngredients.length === 0 || selectedIngredients.some((i) => recipe.categories.includes(i));
      return matchesQuery && matchesCuisine && matchesIngredients;
    });
    setFilteredRecipes(filtered);
  }, [query, selectedCuisine, selectedIngredients, recipes]);

  const toggleCuisine = (type: string) => {
    setSelectedCuisine((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  };

  const toggleIngredient = (type: string) => {
    setSelectedIngredients((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  };

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Aplikace na recepty</h1>
      <SearchBar query={query} onQueryChange={setQuery} />

      <div className="space-y-4">
        <div>
          <button onClick={() => setShowCuisine(!showCuisine)} className="w-full text-left font-semibold text-gray-700 bg-gray-100 px-4 py-2 rounded-md">
            Typ kuchyně {showCuisine ? "▲" : "▼"}
          </button>
          {showCuisine && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
              {CUISINE_TYPES.map((type) => (
                <label key={type} className="inline-flex items-center">
                  <input type="checkbox" checked={selectedCuisine.includes(type)} onChange={() => toggleCuisine(type)} className="mr-2" />
                  {type}
                </label>
              ))}
            </div>
          )}
        </div>

        <div>
          <button
            onClick={() => setShowIngredients(!showIngredients)}
            className="w-full text-left font-semibold text-gray-700 bg-gray-100 px-4 py-2 rounded-md"
          >
            Dle surovin {showIngredients ? "▲" : "▼"}
          </button>
          {showIngredients && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
              {INGREDIENT_TYPES.map((type) => (
                <label key={type} className="inline-flex items-center">
                  <input type="checkbox" checked={selectedIngredients.includes(type)} onChange={() => toggleIngredient(type)} className="mr-2" />
                  {type}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {filteredRecipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-6">
          {filteredRecipes.map((recipe) => (
            <Link key={recipe.id} href={`/recepty/${recipe.id}`} className="border rounded shadow hover:shadow-lg transition overflow-hidden block">
              <img
                src={`${API_URL}${recipe.image_url}`}
                alt={recipe.title}
                className="w-full h-48 object-cover"
                onError={(e) => ((e.target as HTMLImageElement).src = "/placeholder.jpg")}
              />
              <div className="p-4">
                <h2 className="text-xl font-semibold">{recipe.title}</h2>
                {recipe.meal_types && recipe.meal_types.length > 0 && <p className="text-sm text-gray-500">{recipe.meal_types.join(", ")}</p>}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-6 text-gray-500">Zadej název receptu nebo vyber filtr pro zobrazení výsledků.</p>
      )}
    </main>
  );
}
