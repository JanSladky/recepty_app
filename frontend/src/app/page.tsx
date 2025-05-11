"use client";

import { useState, useEffect } from "react";
import SearchBar from "@/components/SearchBar";
import CategorySelector from "@/components/CategorySelector";
import MealTypeSelector from "@/components/MealTypeSelector";
import Link from "next/link";

type Recipe = {
  id: number;
  title: string;
  image_url: string;
  categories: string[];
  meal_types?: string[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedMealTypes, setSelectedMealTypes] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const res = await fetch(`${API_URL}/api/recipes`);
        const data = await res.json();
        console.log("📦 Načtená odpověď:", data);

        const parsed: Recipe[] = Array.isArray(data) ? data : [];
        setRecipes(parsed);
      } catch (error) {
        console.error("❌ Chyba při načítání receptů:", error);
        setRecipes([]);
      }
    };

    fetchRecipes();
  }, []);

  useEffect(() => {
    const shouldFilter =
      query.trim() !== "" ||
      selectedCategories.length > 0 ||
      selectedMealTypes.length > 0;

    if (!shouldFilter) {
      setFilteredRecipes([]);
      return;
    }

    const filtered = recipes.filter((recipe) => {
      const matchesQuery = recipe.title.toLowerCase().includes(query.toLowerCase());

      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.some((cat) => recipe.categories.includes(cat));

      const matchesMealType =
        selectedMealTypes.length === 0 ||
        (recipe.meal_types ?? []).some((type) => selectedMealTypes.includes(type));

      return matchesQuery && matchesCategory && matchesMealType;
    });

    setFilteredRecipes(filtered);
  }, [query, selectedCategories, selectedMealTypes, recipes]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleMealType = (type: string) => {
    setSelectedMealTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Aplikace na recepty</h1>

      <SearchBar query={query} onQueryChange={setQuery} />
      <CategorySelector selected={selectedCategories} onToggle={toggleCategory} />
      <MealTypeSelector selected={selectedMealTypes} onToggle={toggleMealType} />

      {filteredRecipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-6">
          {filteredRecipes.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/recepty/${recipe.id}`}
              className="border rounded shadow hover:shadow-lg transition overflow-hidden block"
            >
              <img
                src={`${API_URL}${recipe.image_url}`}
                alt={recipe.title}
                className="w-full h-48 object-cover"
                onError={(e) =>
                  ((e.target as HTMLImageElement).src = "/placeholder.jpg")
                }
              />
              <div className="p-4">
                <h2 className="text-xl font-semibold">{recipe.title}</h2>
                {recipe.meal_types && recipe.meal_types.length > 0 && (
                  <p className="text-sm text-gray-500">
                    {recipe.meal_types.join(", ")}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-6 text-gray-500">
          Zadej název receptu nebo vyber filtr pro zobrazení výsledků.
        </p>
      )}
    </main>
  );
}