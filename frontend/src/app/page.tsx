"use client";

import { useState, useEffect } from "react";
import SearchBar from "@/components/SearchBar";
import Link from "next/link";
import Image from "next/image";
import { CUISINE_CATEGORIES, MEALTYPE_CATEGORIES, ALL_MEAL_TYPES } from "@/constants/categories";
import useAdmin from "@/hooks/useAdmin";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Recipe = {
  id: number;
  title: string;
  image_url: string;
  categories: string[];
  meal_types?: string[];
};

// Pomocná funkce pro normalizaci textu (odstranění diakritiky a malá písmena)
const normalizeText = (text: string): string =>
  text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export default function HomePage() {
  const { isAdmin, loading } = useAdmin();

  const [query, setQuery] = useState("");
  const [selectedMealTypes, setSelectedMealTypes] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCuisine, setSelectedCuisine] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [showCuisine, setShowCuisine] = useState(false);
  const [showCategories, setShowCategories] = useState(false); // Defaultně zavřeno

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
      
      const matchesMealType =
        selectedMealTypes.length === 0 ||
        selectedMealTypes.some((selected) =>
          (recipe.meal_types || []).some((type) => normalizeText(type) === normalizeText(selected))
        );

      const allSelectedCategories = [...selectedCategories, ...selectedCuisine];
      const matchesCategory =
        allSelectedCategories.length === 0 ||
        allSelectedCategories.some((selected) =>
          recipe.categories.some((cat) => normalizeText(cat) === normalizeText(selected))
        );

      return matchesQuery && matchesMealType && matchesCategory;
    });

    setFilteredRecipes(filtered);
  }, [query, selectedMealTypes, selectedCategories, selectedCuisine, recipes]);

  const toggleMealType = (type: string) => {
    setSelectedMealTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleCategory = (type: string) => {
    setSelectedCategories((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleCuisine = (type: string) => {
    setSelectedCuisine((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const hasActiveFilter = query || selectedMealTypes.length > 0 || selectedCategories.length > 0 || selectedCuisine.length > 0;

  return (
    <div className="bg-gray-50 min-h-screen">
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-800">Najdi si svůj recept</h1>
            <p className="text-lg text-gray-500 mt-2">Procházej, filtruj a objevuj nová jídla.</p>
        </div>

        {/* Panel s filtry a vyhledáváním - ODSTRANĚNO STICKY CHOVÁNÍ */}
        <div className="bg-white p-6 rounded-2xl shadow-sm mb-8">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-grow">
                    <SearchBar query={query} onQueryChange={setQuery} />
                </div>
                {!loading && isAdmin && (
                    <Link href="/pridat-recept" className="flex-shrink-0 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg inline-flex items-center justify-center transition duration-200">
                    ➕ Přidat recept
                    </Link>
                )}
            </div>

            <div className="mt-6">
                <h3 className="text-md font-semibold text-gray-600 mb-3">Typ chodu</h3>
                <div className="flex flex-wrap gap-3">
                    {ALL_MEAL_TYPES.map((type) => (
                    <button
                        key={type}
                        onClick={() => toggleMealType(type)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                        selectedMealTypes.includes(type)
                            ? "bg-green-600 text-white shadow-md scale-105"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                    >
                        {type}
                    </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div>
                    <button
                        onClick={() => setShowCuisine(!showCuisine)}
                        className="w-full text-left font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 px-4 py-3 rounded-lg flex justify-between items-center transition"
                    >
                        Typ kuchyně <span>{showCuisine ? "▲" : "▼"}</span>
                    </button>
                    {showCuisine && (
                        <div className="bg-gray-50 p-4 rounded-b-lg grid grid-cols-2 sm:grid-cols-3 gap-3 mt-1">
                        {CUISINE_CATEGORIES.map((type) => (
                            <label key={type} className="inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedCuisine.includes(type)}
                                onChange={() => toggleCuisine(type)}
                                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">{type}</span>
                            </label>
                        ))}
                        </div>
                    )}
                </div>
                <div>
                    <button
                        onClick={() => setShowCategories(!showCategories)}
                        className="w-full text-left font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 px-4 py-3 rounded-lg flex justify-between items-center transition"
                    >
                        Druh jídla <span>{showCategories ? "▲" : "▼"}</span>
                    </button>
                    {showCategories && (
                        <div className="bg-gray-50 p-4 rounded-b-lg grid grid-cols-2 sm:grid-cols-3 gap-3 mt-1">
                        {MEALTYPE_CATEGORIES.map((type) => (
                            <label key={type} className="inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedCategories.includes(type)}
                                onChange={() => toggleCategory(type)}
                                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">{type}</span>
                            </label>
                        ))}
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Výpis receptů */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {(hasActiveFilter ? filteredRecipes : recipes).map((recipe) => (
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
                        ? `${API_URL}${recipe.image_url}`
                        : "/placeholder.jpg"
                    }
                    alt={recipe.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  {recipe.meal_types && recipe.meal_types.length > 0 && (
                      <span className="absolute top-2 right-2 bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
                          {recipe.meal_types[0]}
                      </span>
                  )}
                </div>
                <div className="p-4">
                  <h2 className="text-lg font-bold text-gray-800 truncate group-hover:text-green-600 transition-colors">{recipe.title}</h2>
                </div>
              </Link>
            ))}
        </div>
        
        {hasActiveFilter && filteredRecipes.length === 0 && (
            <div className="text-center py-16">
                <p className="text-xl text-gray-500">Žádné recepty neodpovídají hledání.</p>
                <p className="text-gray-400 mt-2">Zkuste upravit filtry.</p>
            </div>
        )}

      </main>
    </div>
  );
}