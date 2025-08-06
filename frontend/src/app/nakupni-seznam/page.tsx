"use client";

import { useState, useEffect } from "react";
import SearchBar from "@/components/SearchBar";
import { Trash2 } from "lucide-react";
import { Share2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Ingredient = { name: string; [key: string]: unknown };
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
    const ingredients = recipesToCook.flatMap((recipe) => recipe.ingredients || []);

    const aggregated: Record<string, { name: string; unit: string; amount: number }> = {};

    for (const ing of ingredients) {
      const name = ing.name?.toString().trim() ?? "";
      const unit = ing.unit?.toString().trim() ?? "";
      const amount = parseFloat(ing.amount as string) || 0;

      const key = `${name}||${unit}`;

      if (!aggregated[key]) {
        aggregated[key] = { name, unit, amount };
      } else {
        aggregated[key].amount += amount;
      }
    }

    const list = Object.values(aggregated)
      .map((i) => `${i.amount} ${i.unit} ${i.name}`.trim())
      .sort();

    setShoppingList(list);
  }, [recipesToCook]);

  const fetchRecipeWithIngredients = async (id: number): Promise<Recipe> => {
    const res = await fetch(`${API_URL}/api/recipes/${id}`);
    if (!res.ok) {
      throw new Error(`Chyba při načítání detailu receptu ${id}`);
    }
    return await res.json();
  };

  const addRecipeToCook = async (recipe: Recipe) => {
    const alreadyAdded = recipesToCook.some((r) => Number(r.id) === Number(recipe.id));
    if (alreadyAdded) return; // zabrání duplicitě

    try {
      const fullRecipe = await fetchRecipeWithIngredients(recipe.id);
      console.log("Přidáno do plánu:", fullRecipe);

      setRecipesToCook((prev) => {
        const stillNotAdded = !prev.some((r) => Number(r.id) === Number(fullRecipe.id));
        return stillNotAdded ? [...prev, fullRecipe] : prev;
      });
    } catch (error) {
      console.error("Nepodařilo se načíst recept:", error);
    }
  };
  const formattedList = shoppingList.join("\n"); // každý řádek jedna surovina

  const handleShare = async () => {
    const formattedList = shoppingList.join("\n");

    if (navigator.canShare && navigator.canShare({ files: [] })) {
      const blob = new Blob([formattedList], { type: "text/plain" });
      const file = new File([blob], "nakupni-seznam.txt", {
        type: "text/plain",
      });

      try {
        await navigator.share({
          title: "Nákupní seznam",
          files: [file],
        });
      } catch (error) {
        console.error("Sdílení selhalo:", error);
      }
    } else {
      alert("Sdílení souborů není v tomto prohlížeči podporováno.");
    }
  };
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedList);
      alert("Seznam byl zkopírován do schránky.");
    } catch (err) {
      console.error("Nepodařilo se kopírovat:", err);
    }
  };

  const removeRecipeFromCook = (recipeId: number) => {
    setRecipesToCook((prev) => prev.filter((r) => r.id !== recipeId));
  };

  const filteredRecipes = query.length >= 3 ? allRecipes.filter((r) => r.title.toLowerCase().includes(query.toLowerCase())) : [];

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
              {filteredRecipes.map((recipe) => {
                const isAdded = recipesToCook.some((r) => r.id === recipe.id);
                return (
                  <div key={recipe.id} className="flex items-center justify-between bg-white p-2 rounded-lg shadow-sm">
                    <span>{recipe.title}</span>
                    {isAdded ? (
                      <button disabled className="bg-gray-100 text-gray-400 text-sm font-semibold px-3 py-1 rounded-md cursor-not-allowed">
                        Přidáno
                      </button>
                    ) : (
                      <button
                        onClick={() => addRecipeToCook(recipe)}
                        className="bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-md hover:bg-green-200"
                      >
                        Přidat
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {recipesToCook.length > 0 && (
              <div className="mt-8">
                <h3 className="font-bold text-lg mb-2">Plán vaření:</h3>
                <div className="space-y-2">
                  {recipesToCook.map((recipe) => (
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Co nakoupit:</h2>
              <div className="flex gap-4 items-center">
                <button onClick={handleShare} className="text-blue-600 hover:text-blue-800" title="Sdílet seznam">
                  <Share2 size={22} />
                </button>
                <button onClick={handleCopy} className="text-gray-600 hover:text-gray-800 text-sm underline">
                  Kopírovat
                </button>
              </div>
            </div>
            {shoppingList.length > 0 ? (
              <ul className="space-y-2">
                {shoppingList.map((item) => (
                  <li key={item} className="p-2 bg-gray-50 rounded flex justify-between items-center">
                    <span>{item}</span>
                    <button
                      onClick={() => setShoppingList((prev) => prev.filter((i) => i !== item))}
                      className="text-red-500 hover:text-red-700"
                      title="Odebrat ze seznamu"
                    >
                      <Trash2 size={18} />
                    </button>
                  </li>
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
