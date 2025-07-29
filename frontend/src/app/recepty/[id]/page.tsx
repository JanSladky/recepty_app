"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import useAdmin from "@/hooks/useAdmin";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// --- Helper Icons ---
const IconEdit = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const IconTrash = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;
const IconHeart = ({ isFavorite }: { isFavorite: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-all duration-200 ${isFavorite ? 'text-red-500' : 'text-gray-500'}`}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
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

  // Načteme email a oblíbené recepty po načtení stránky
  const fetchFavorites = useCallback(async (email: string, recipeId: number) => {
    try {
      const res = await fetch(`${API_URL}/api/user/favorites`, {
        headers: { "x-user-email": email },
      });
      if (res.ok) {
        const data = await res.json();
        // Zkontrolujeme, jestli aktuální recept je v seznamu oblíbených
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
        // Jakmile máme recept, a pokud máme email, načteme oblíbené
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
      
      // Okamžitá vizuální odezva pro lepší uživatelský zážitek
      setIsFavorite(prev => !prev);

      try {
          await fetch(`${API_URL}/api/user/favorites/${recipe.id}`, {
              method: 'POST',
              headers: { "x-user-email": userEmail },
          });
          // Po úspěšném odeslání můžeme znovu načíst stav pro jistotu (volitelné)
          // fetchFavorites(userEmail, recipe.id);
      } catch (error) {
          console.error("Chyba při přepínání oblíbených:", error);
          // Vrátíme zpět v případě chyby
          setIsFavorite(prev => !prev);
          alert("Akce se nezdařila, zkuste to prosím znovu.");
      }
  };

  const handleDelete = async () => {
    if (!recipe || !confirm("Opravdu chceš smazat tento recept?")) return;
    try {
      const res = await fetch(`${API_URL}/api/recipes/${recipe.id}`, { method: "DELETE" });
      if (res.ok) {
        alert("✅ Recept smazán");
        router.push("/recepty");
      } else {
        const errorData = await res.json();
        alert(`❌ Chyba při mazání: ${errorData.error || "Neznámá chyba"}`);
      }
    } catch (error) {
        console.error("Chyba při komunikaci (mazání):", error);
        alert("❌ Neznámá chyba při mazání.");
    }
  };

  const handleEdit = () => router.push(`/recepty/${recipe?.id}/upravit`);

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
            {recipe.calories && recipe.calories > 0 && 
              <span className="mt-2 text-xl bg-yellow-400 text-gray-900 font-semibold px-4 py-1 rounded-full w-fit">{recipe.calories} kcal</span>
            }
          </div>
          <div className="absolute top-4 right-4 flex gap-3">
              {userEmail && (
                <button onClick={handleToggleFavorite} className="bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-md hover:bg-white transition transform hover:scale-110">
                    <IconHeart isFavorite={isFavorite} />
                </button>
              )}
              {!adminLoading && isAdmin && (
                <>
                  <button onClick={handleEdit} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg inline-flex items-center gap-2 transition shadow-md">
                    <IconEdit /> Upravit
                  </button>
                  <button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg inline-flex items-center gap-2 transition shadow-md">
                    <IconTrash /> Smazat
                  </button>
                </>
              )}
          </div>
        </div>

        <div className="p-4 md:p-8">
          {/* Zbytek stránky zůstává stejný */}
        </div>
      </main>
    </div>
  );
}