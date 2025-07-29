"use client";

import { useState, useEffect } from "react";
import SearchBar from "@/components/SearchBar";
import Image from "next/image";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Ingredient = { name: string; [key: string]: any };
type Recipe = { id: number; title: string; image_url: string; ingredients: Ingredient[] };

export default function ShoppingListPage() {
    const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
    const [query, setQuery] = useState("");
    const [recipesToCook, setRecipesToCook] = useState<Recipe[]>([]);
    const [shoppingList, setShoppingList] = useState<string[]>([]);

    useEffect(() => {
        const fetchRecipes = async () => {
            try {
                const res = await fetch(`${API_URL}/api/recipes`);
                const data = await res.json();
                setAllRecipes(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Chyba při načítání receptů:", error);
            }
        };
        fetchRecipes();
    }, []);

    useEffect(() => {
        const ingredients = recipesToCook.flatMap(recipe => recipe.ingredients || []);
        const ingredientNames = ingredients.map(ing => ing.name);
        const uniqueNames = [...new Set(ingredientNames)];
        setShoppingList(uniqueNames.sort());
    }, [recipesToCook]);

    const addRecipeToCook = (recipe: Recipe) => {
        if (!recipesToCook.some(r => r.id === recipe.id)) {
            setRecipesToCook(prev => [...prev, recipe]);
        }
    };

    const removeRecipeFromCook = (recipeId: number) => {
        setRecipesToCook(prev => prev.filter(r => r.id !== recipeId));
    };

    const filteredRecipes = query.length >= 3 
        ? allRecipes.filter(r => r.title.toLowerCase().includes(query.toLowerCase()))
        : [];

    return (
        <div className="bg-gray-50 min-h-screen">
            <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-4xl sm:text-5xl font-bold text-gray-800">Nákupní seznam</h1>
                    <p className="text-lg text-gray-500 mt-2">Vyhledej recepty a přidej je do plánu vaření.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Levá část - Vyhledávání a plán */}
                    <div>
                        <SearchBar query={query} onQueryChange={setQuery} />
                        <div className="mt-4 space-y-2">
                            {filteredRecipes.map(recipe => (
                                <div key={recipe.id} className="flex items-center justify-between bg-white p-2 rounded-lg shadow-sm">
                                    <span>{recipe.title}</span>
                                    <button onClick={() => addRecipeToCook(recipe)} className="bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-md hover:bg-green-200">
                                        Přidat
                                    </button>
                                </div>
                            ))}
                        </div>
                        
                        {recipesToCook.length > 0 && (
                            <div className="mt-8">
                                <h3 className="font-bold text-lg mb-2">Plán vaření:</h3>
                                <div className="space-y-2">
                                    {recipesToCook.map(recipe => (
                                        <div key={recipe.id} className="flex items-center justify-between bg-white p-2 rounded-lg shadow-sm">
                                            <span>{recipe.title}</span>
                                            <button onClick={() => removeRecipeFromCook(recipe.id)} className="text-red-500 text-sm font-semibold">
                                                Odebrat
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Pravá část - Nákupní seznam */}
                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Co nakoupit:</h2>
                        {shoppingList.length > 0 ? (
                            <ul className="space-y-2">
                                {shoppingList.map(name => (
                                    <li key={name} className="p-2 bg-gray-50 rounded">{name}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500">Přidej recept do plánu a zde se objeví seznam surovin.</p>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
