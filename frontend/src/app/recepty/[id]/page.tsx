"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import useAdmin from "@/hooks/useAdmin";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// --- Helper Icons ---
const IconEdit = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);
const IconTrash = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);
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
    className={`transition-all duration-200 ${isFavorite ? "text-red-500" : "text-gray-500"}`}
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
  </svg>
);

interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  calories_per_gram: number | string;
  display?: string | null;
  default_grams?: number;
}

interface Recipe {
  id: number;
  title: string;
  notes?: string;
  image_url?: string;
  categories?: string[];
  ingredients?: Ingredient[];
  meal_types?: string[];
  steps?: string[];
  calories?: number;
}

export default function DetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const fetchFavorites = useCallback(async (email: string, recipeId: number) => {
    try {
      const res = await fetch(`${API_URL}/api/user/favorites`, {
        headers: { "x-user-email": email },
      });
      if (res.ok) {
        const data = await res.json();
        setIsFavorite((data.favoriteIds || []).includes(recipeId));
      }
    } catch (error) {
      console.error("Chyba při načítání oblíbených:", error);
    }
  }, []);

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    setUserEmail(email);

    const fetchRecipe = async () => {
      if (!id || typeof id !== "string") return;
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/recipes/${id}`);
        if (!res.ok) throw new Error("Recept se nepodařilo načíst");
        const data: Recipe = await res.json();
        setRecipe(data);
        if (email) {
          fetchFavorites(email, data.id);
        }
      } catch (error) {
        console.error("Chyba při načítání receptu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id, fetchFavorites]);

  const handleToggleFavorite = async () => {
    if (!userEmail || !recipe) {
      alert("Pro přidání do oblíbených se musíte přihlásit.");
      router.push("/login");
      return;
    }

    setIsFavorite((prev) => !prev);

    try {
      await fetch(`${API_URL}/api/user/favorites/${recipe.id}`, {
        method: "POST",
        headers: { "x-user-email": userEmail },
      });
    } catch (error) {
      console.error("Chyba při přepínání oblíbených:", error);
      setIsFavorite((prev) => !prev);
      alert("Akce se nezdařila, zkuste to prosím znovu.");
    }
  };

  const handleDelete = async () => {
    if (!recipe || !confirm("Opravdu chceš smazat tento recept?")) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("❌ Chybí token. Přihlas se znovu.");
        return;
      }

      const res = await fetch(`${API_URL}/api/recipes/${recipe.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        alert("✅ Recept smazán");
        router.push("/recepty");
      } else {
        const errorData = await res.json();
        alert(`❌ Chyba při mazání: ${errorData.message || errorData.error || "Neznámá chyba"}`);
      }
    } catch (error) {
      console.error("❌ Chyba při mazání receptu:", error);
      alert("❌ Neznámá chyba při mazání.");
    }
  };
  const handleEdit = () => router.push(`/recepty/${recipe?.id}/upravit`);

  const getFractionLabel = (amount: number) => {
    if (Math.abs(amount - 0.5) < 0.01) return "polovina";
    if (Math.abs(amount - 1 / 3) < 0.01) return "třetina";
    if (Math.abs(amount - 0.25) < 0.01) return "čtvrtina";
    return null;
  };

  if (loading) return <div className="text-center p-10">Načítání receptu...</div>;
  if (!recipe) return <div className="text-center p-10 text-red-600">Recept nenalezen.</div>;

  const imageUrl = recipe.image_url?.startsWith("http") ? recipe.image_url : recipe.image_url ? `${API_URL}${recipe.image_url}` : "/placeholder.jpg";

  return (
    <div className="bg-gray-50 min-h-screen">
      <main className="max-w-5xl mx-auto">
        <div className="relative h-64 md:h-80 w-full rounded-b-3xl overflow-hidden shadow-lg">
          <Image src={imageUrl} alt={recipe.title} fill className="object-cover" unoptimized />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20 flex flex-col justify-end p-6 md:p-8">
            <h1 className="text-3xl md:text-5xl font-bold text-white drop-shadow-lg">{recipe.title}</h1>
            {recipe.calories && recipe.calories > 0 && (
              <span className="mt-2 text-xl bg-yellow-400 text-gray-900 font-semibold px-4 py-1 rounded-full w-fit">{recipe.calories} kcal</span>
            )}
          </div>
          <div className="absolute top-4 right-4 flex gap-3">
            {userEmail && (
              <button
                onClick={handleToggleFavorite}
                className="bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-md hover:bg-white transition transform hover:scale-110"
              >
                <IconHeart isFavorite={isFavorite} />
              </button>
            )}
            {!adminLoading && isAdmin && (
              <>
                <button
                  onClick={handleEdit}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg inline-flex items-center gap-2 transition shadow-md"
                >
                  <IconEdit /> Upravit
                </button>
                <button
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg inline-flex items-center gap-2 transition shadow-md"
                >
                  <IconTrash /> Smazat
                </button>
              </>
            )}
          </div>
        </div>

        {/* --- ZDE JE VRÁCENÝ OBSAH --- */}
        <div className="p-4 md:p-8">
          {(recipe.meal_types?.length || recipe.categories?.length) && (
            <div className="flex flex-wrap gap-2 mb-8">
              {recipe.meal_types?.map((type) => (
                <span key={type} className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                  {type}
                </span>
              ))}
              {recipe.categories?.map((cat) => (
                <span key={cat} className="bg-gray-200 text-gray-700 text-sm font-medium px-3 py-1 rounded-full">
                  {cat}
                </span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            <div className="lg:col-span-1 space-y-8">
              {recipe.ingredients && recipe.ingredients.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Ingredience</h2>
                  <ul className="space-y-3">
                    {recipe.ingredients.map((ing, i) => {
                      const unit = ing.unit ?? "g";
                      const amount = Number(ing.amount) || 0;
                      const caloriesPerGram = Number(ing.calories_per_gram) || 0;
                      const grams = unit === "ks" && ing.default_grams ? amount * ing.default_grams : amount;
                      const kcal = Math.round(grams * caloriesPerGram);

                      const fractionLabel = unit === "ks" ? getFractionLabel(amount) : null;
                      const label = ing.display
                        ? ing.display
                        : unit === "ks"
                        ? fractionLabel
                          ? `${fractionLabel} ${ing.name} (${Math.round(grams)} g)`
                          : `${amount} ks ${ing.name} (${Math.round(grams)} g)`
                        : `${amount} ${unit} ${ing.name}`;

                      return (
                        <li key={i} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
                          <span className="text-gray-700">{label}</span>
                          {kcal > 0 && <span className="text-sm font-semibold bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">{kcal} kcal</span>}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              {recipe.notes && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Poznámky</h2>
                  <p className="text-gray-600 whitespace-pre-line bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">{recipe.notes}</p>
                </div>
              )}
            </div>

            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Postup</h2>
              {recipe.steps && recipe.steps.length > 0 ? (
                <ol className="space-y-6">
                  {recipe.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-green-600 text-white font-bold text-lg rounded-full flex items-center justify-center shadow">
                        {i + 1}
                      </div>
                      <p className="text-gray-700 pt-2">{step}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-gray-500">Postup nebyl zadán.</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
