"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const IconHeart = ({ isFavorite }: { isFavorite: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill={isFavorite ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`transition-all duration-200 ${isFavorite ? "text-red-500" : "text-white"}`}
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
  </svg>
);

type Ingredient = { name: string; unit?: string; amount?: number };
type Recipe = {
  id: number;
  title: string;
  image_url: string;
  meal_types?: string[];
  ingredients?: Ingredient[];
};

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

export default function ReceptyPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const [cartCount, setCartCount] = useState<number>(0);
  const [cartIds, setCartIds] = useState<number[]>([]);
  const [justAddedTitle, setJustAddedTitle] = useState<string | null>(null);

  // init košíku po mountu
  useEffect(() => {
    const items = readCart();
    setCartCount(items.length);
    setCartIds(items.map((i) => i.id));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchData = async () => {
      try {
        setLoading(true);

        // 1) recepty
        const recipesRes = await fetch(`${API_URL}/api/recipes`);
        const recipesData = await recipesRes.json();
        setRecipes(Array.isArray(recipesData) ? recipesData : []);

        // 2) oblíbené
        if (token) {
          const favRes = await fetch(`${API_URL}/api/user/favorites`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (favRes.ok) {
            const favData = await favRes.json();
            setFavoriteIds(Array.isArray(favData) ? favData.map((r: { id: number }) => r.id) : []);
          }
        }
      } catch (error) {
        console.error("❌ Chyba při načítání dat:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleToggleFavorite = async (recipeId: number) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Musíte být přihlášen");
      return;
    }

    const isFav = favoriteIds.includes(recipeId);
    setFavoriteIds((prev) => (isFav ? prev.filter((id) => id !== recipeId) : [...prev, recipeId]));

    try {
      const res = await fetch(`${API_URL}/api/user/favorites/${recipeId}/toggle`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Neúspěšné uložení");
    } catch (error) {
      console.error("❌ Chyba při uložení oblíbeného:", error);
      setFavoriteIds((prev) => (isFav ? [...prev, recipeId] : prev.filter((id) => id !== recipeId)));
    }
  };

  // Přidat do košíku
  const addToCart = async (recipeId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`${API_URL}/api/recipes/${recipeId}`);
      if (!res.ok) throw new Error("Nepodařilo se načíst recept");
      const full: Recipe = await res.json();

      const current = readCart();
      if (current.find((i) => i.id === recipeId)) {
        setJustAddedTitle("Recept už je v košíku");
        setTimeout(() => setJustAddedTitle(null), 4000);
        return;
      }
      const item: CartItem = {
        id: full.id,
        title: full.title,
        ingredients: (full.ingredients || []) as Ingredient[],
      };
      const updated = [...current, item];
      writeCart(updated);

      // 🔔 oznám změnu košíku (pro Navbar badge)
      window.dispatchEvent(new Event("cartUpdated"));

      setCartCount(updated.length);
      setCartIds(updated.map((i) => i.id));
      setJustAddedTitle(`Přidáno: ${full.title}`);
      setTimeout(() => setJustAddedTitle(null), 4000);
    } catch (e) {
      console.error(e);
      alert("Nepodařilo se přidat do košíku.");
    }
  };

  // Odebrat z košíku (bez fetchu – máme title v kartě)
  const removeFromCart = (recipeId: number, title: string) => {
    const current = readCart();
    const updated = current.filter((i) => i.id !== recipeId); // ← OPRAVENO (odstraněno „the“)
    writeCart(updated);

    // 🔔 oznám změnu košíku (pro Navbar badge)
    window.dispatchEvent(new Event("cartUpdated"));

    setCartCount(updated.length);
    setCartIds(updated.map((i) => i.id));
    setJustAddedTitle(`Odebráno: ${title}`);
    setTimeout(() => setJustAddedTitle(null), 4000);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="text-center sm:text-left">
            <h1 className="text-4xl font-bold text-gray-800">Všechny recepty</h1>
            <p className="text-lg text-gray-500 mt-2">Prohlížej si naši kompletní sbírku.</p>
          </div>

          <Link
            href="/nakupni-seznam"
            className="relative inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition"
            title="Přejít na nákupní seznam"
          >
            <ShoppingCart size={20} />
            Košík
            {cartCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center text-xs font-bold bg-white text-green-700 rounded-full w-6 h-6">{cartCount}</span>
            )}
          </Link>
        </div>

        {justAddedTitle && (
          <div className="mb-6 rounded-lg bg-green-50 text-green-800 border border-green-200 px-4 py-2">
            {justAddedTitle} –{" "}
            <Link href="/nakupni-seznam" className="underline">
              Přejít na seznam
            </Link>
          </div>
        )}

        {loading ? (
          <p className="text-center text-gray-500">Načítám recepty...</p>
        ) : (
          <>
            {/* Přepínač Všechny / Oblíbené */}
            <div className="flex justify-center mb-6">
              <button
                onClick={() => setShowFavoritesOnly(false)}
                className={`px-4 py-2 rounded-l-full border ${!showFavoritesOnly ? "bg-green-600 text-white" : "bg-white text-gray-800"}`}
              >
                Všechny
              </button>
              <button
                onClick={() => setShowFavoritesOnly(true)}
                className={`px-4 py-2 rounded-r-full border ${showFavoritesOnly ? "bg-green-600 text-white" : "bg-white text-gray-800"}`}
              >
                Oblíbené
              </button>
            </div>

            {/* Výpis receptů */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {(showFavoritesOnly ? recipes.filter((r) => favoriteIds.includes(r.id)) : recipes).map((recipe) => {
                const isFavorite = favoriteIds.includes(recipe.id);
                const img =
                  recipe.image_url && recipe.image_url.startsWith("http")
                    ? recipe.image_url
                    : recipe.image_url
                    ? `${API_URL ?? ""}${recipe.image_url}`
                    : "/placeholder.jpg";

                const inCart = cartIds.includes(recipe.id);

                return (
                  <div
                    key={recipe.id}
                    className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden block transform hover:-translate-y-1 relative"
                  >
                    <Link href={`/recepty/${recipe.id}`}>
                      <div className="relative w-full h-48">
                        <Image src={img} alt={recipe.title} fill className="object-cover transition-transform duration-300 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        <div className="absolute top-2 right-2 flex flex-wrap-reverse gap-1">
                          {recipe.meal_types?.map((type) => (
                            <span key={type} className="bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    </Link>

                    {/* Akční tlačítka na obrázku */}
                    <div className="absolute top-2 left-2 flex gap-2 z-10">
                      {localStorage.getItem("token") && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleToggleFavorite(recipe.id);
                          }}
                          className="bg-black/30 backdrop-blur-sm p-2 rounded-full hover:bg-black/50 transition"
                          aria-label="Přidat do oblíbených"
                        >
                          <IconHeart isFavorite={isFavorite} />
                        </button>
                      )}

                      {/* Toggle košíku: přidat / odebrat */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          if (inCart) {
                            removeFromCart(recipe.id, recipe.title);
                          } else {
                            addToCart(recipe.id, e);
                          }
                        }}
                        className={`relative p-2 rounded-full backdrop-blur-sm transition text-white ${
                          inCart ? "bg-red-500/70 hover:bg-red-600" : "bg-black/30 hover:bg-black/50"
                        }`}
                        title={inCart ? "Odebrat z košíku" : "Přidat do nákupního seznamu"}
                        aria-label={inCart ? "Odebrat z košíku" : "Přidat do košíku"}
                      >
                        <ShoppingCart size={20} />
                        {inCart && <span className="pointer-events-none absolute left-1 right-1 top-1/2 h-0.5 bg-white/90 rotate-45"></span>}
                      </button>
                    </div>

                    <div className="p-4">
                      <h2 className="text-lg font-bold text-gray-800 truncate group-hover:text-green-600 transition-colors">{recipe.title}</h2>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}