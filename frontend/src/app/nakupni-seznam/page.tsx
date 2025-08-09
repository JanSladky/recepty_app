// 📁 frontend/src/app/nakupni-seznam/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Trash2, Share2, RotateCcw, ShoppingCart } from "lucide-react";

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
    setRecipesToCook((items as unknown) as Recipe[]);
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
      writeCart((next as unknown) as CartItem[]);
      return next;
    });
  };

  const clearCart = () => {
    writeCart([]);
    setRecipesToCook([]);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-6xl mx-auto">
        {/* HLAVIČKA */}
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900">Nákupní seznam</h1>
              <p className="text-gray-500 mt-1">
                Recepty přidávej kliknutím na košík u receptu. Vpravo se ti automaticky sečtou suroviny.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/recepty"
                className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 shadow-sm hover:bg-gray-50 transition"
              >
                ← Zpět na recepty
              </Link>

              {recipesToCook.length > 0 && (
                <button
                  onClick={clearCart}
                  className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2.5 text-gray-700 hover:bg-gray-200 transition"
                  title="Vyprázdnit košík"
                >
                  <RotateCcw size={18} />
                  Vyprázdnit
                </button>
              )}
            </div>
          </div>
        </header>

        {/* OBSAH */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEVÁ KARTA – Plán vaření */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Plán vaření</h2>
              <span className="inline-flex items-center justify-center text-xs font-semibold bg-green-100 text-green-700 rounded-full px-2.5 py-1">
                <ShoppingCart size={14} className="mr-1" />
                {recipesToCook.length}
              </span>
            </div>

            {recipesToCook.length > 0 ? (
              <ul className="space-y-3">
                {recipesToCook.map((recipe) => (
                  <li
                    key={recipe.id}
                    className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5 border border-gray-200"
                  >
                    <span className="font-medium text-gray-800">{recipe.title}</span>
                    <button
                      onClick={() => removeRecipeFromCook(recipe.id)}
                      className="text-red-600 text-sm font-semibold hover:text-red-700"
                    >
                      Odebrat
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-gray-500">
                Zatím nic. Otevři přehled receptů a přidávej je košíkem.
              </div>
            )}
          </div>

          {/* PRAVÁ KARTA – Co nakoupit */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Co nakoupit</h2>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 rounded-lg px-3 py-1.5"
                  title="Sdílet seznam"
                >
                  <Share2 size={18} />
                  Sdílet
                </button>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 rounded-lg px-3 py-1.5"
                >
                  Kopírovat
                </button>
              </div>
            </div>

            {shoppingList.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {shoppingList.map((item) => (
                  <li key={item} className="flex items-center justify-between py-2.5">
                    <span className="text-gray-800">{item}</span>
                    <button
                      onClick={() =>
                        alert("Jednotlivé suroviny se odstraňují vyřazením receptu v levém panelu.")
                      }
                      className="text-red-500 hover:text-red-600"
                      title="Odebrat ze seznamu"
                    >
                      <Trash2 size={18} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-gray-500">
                Přidej recepty do košíku a tady se zobrazí nákupní seznam.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}