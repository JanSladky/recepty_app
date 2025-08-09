"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Trash2, Share2, RotateCcw } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Ingredient = { name: string; unit?: string; amount?: number };
type Recipe = { id: number; title: string; image_url?: string; ingredients: Ingredient[] };
type CartItem = { id: number; title: string; ingredients: Ingredient[] };

const CART_KEY = "shopping_cart_v1";

function readCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}
function writeCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export default function ShoppingListPage() {
  const [recipesToCook, setRecipesToCook] = useState<Recipe[]>([]);

  // Načti vybrané recepty z košíku
  useEffect(() => {
    const items = readCart();
    setRecipesToCook(items as unknown as Recipe[]);
  }, []);

  // Agregace surovin
  const shoppingList = useMemo(() => {
    const ingredients = recipesToCook.flatMap((r) => r.ingredients || []);
    const aggregated: Record<string, { name: string; unit: string; amount: number }> = {};

    for (const ing of ingredients) {
      const name = ing.name?.toString().trim() ?? "";
      const unit = ing.unit?.toString().trim() ?? "";
      const amount = typeof ing.amount === "number" ? ing.amount : parseFloat(String(ing.amount ?? 0)) || 0;
      const key = `${name}||${unit}`;
      if (!aggregated[key]) aggregated[key] = { name, unit, amount };
      else aggregated[key].amount += amount;
    }

    return Object.values(aggregated)
      .map((i) => `${i.amount || 0} ${i.unit || ""} ${i.name}`.trim())
      .sort();
  }, [recipesToCook]);

  const formattedList = shoppingList.join("\n");

  const handleShare = async () => {
    if (navigator.canShare && navigator.canShare({ files: [] })) {
      const blob = new Blob([formattedList], { type: "text/plain" });
      const file = new File([blob], "nakupni-seznam.txt", { type: "text/plain" });
      try {
        await navigator.share({ title: "Nákupní seznam", files: [file] });
      } catch (error) {
        console.error("Sdílení selhalo:", error);
      }
    } else {
      await navigator.clipboard.writeText(formattedList);
      alert("Seznam byl zkopírován do schránky.");
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
    setRecipesToCook((prev) => {
      const next = prev.filter((r) => r.id !== recipeId);
      writeCart(next as unknown as CartItem[]);
      return next;
    });
  };

  const clearCart = () => {
    writeCart([]);
    setRecipesToCook([]);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-800">Nákupní seznam</h1>
            <p className="text-lg text-gray-500 mt-2">Recepty přidávej kliknutím na košík u receptu.</p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/recepty"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border hover:bg-gray-50 transition"
            >
              ← Zpět na recepty
            </Link>
            {recipesToCook.length > 0 && (
              <button
                onClick={clearCart}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                title="Vyprázdnit košík"
              >
                <RotateCcw size={18} />
                Vyprázdnit
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Levá část – vybrané recepty */}
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h3 className="font-bold text-xl mb-4">Plán vaření</h3>

            {recipesToCook.length > 0 ? (
              <div className="space-y-2">
                {recipesToCook.map((recipe) => (
                  <div key={recipe.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <span className="font-medium">{recipe.title}</span>
                    <button
                      onClick={() => removeRecipeFromCook(recipe.id)}
                      className="text-red-500 text-sm font-semibold"
                    >
                      Odebrat
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Zatím nic. Přidej si recepty z přehledu.</p>
            )}
          </div>

          {/* Pravá část – agregovaný nákupní seznam */}
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Co nakoupit</h2>
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
                      onClick={() =>
                        alert("Jednotlivé suroviny se odstraňují vyřazením receptu v levém panelu.")
                      }
                      className="text-red-500 hover:text-red-700"
                      title="Odebrat ze seznamu"
                    >
                      <Trash2 size={18} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">Přidej recepty do košíku a tady se zobrazí nákupní seznam.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}