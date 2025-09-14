"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import useAdmin from "@/hooks/useAdmin";

import NutritionDonuts from "@/components/NutritionDonuts";
import IngredientNutritionModal, { IngredientForModal } from "@/components/IngredientNutritionModal";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

// --- Helper Icons ---
const IconEdit = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z" />
  </svg>
);
const IconTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
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
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21.2l7.8-7.8a5.5 5.5 0 0 0 0-7.8z" />
  </svg>
);

/** Rozšířená ingredience včetně OFF polí */
interface Ingredient extends IngredientForModal {
  name: string;
  amount: number;
  unit: string;
  calories_per_gram: number | string;
  display?: string | null;
  default_grams?: number;
}

/** Typ pro recept z API */
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
  status?: "PENDING" | "APPROVED" | "REJECTED";
  nutrition_totals?: {
    kcal: number;
    proteins: number;
    carbs: number;
    sugars: number;
    fat: number;
    saturated_fat: number;
    fiber: number;
    sodium: number; // v gramech
  };
}

export default function DetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const { isAdmin, loading: adminLoading } = useAdmin();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalIng, setModalIng] = useState<IngredientForModal | null>(null);

  const fetchFavorites = useCallback(async (email: string, recipeId: number) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/user/favorites`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        const favoriteIds = Array.isArray(data) ? data.map((r: { id: number }) => r.id) : [];
        setIsFavorite(favoriteIds.includes(recipeId));
      }
    } catch (error) {
      console.error("Chyba při načítání oblíbených receptů:", error);
    }
  }, []);

  useEffect(() => {
    const email = typeof window !== "undefined" ? localStorage.getItem("userEmail") : null;
    setUserEmail(email || null);

    const fetchRecipe = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

        const res = await fetch(`${API_URL}/api/recipes/${id}`, { headers });
        if (!res.ok) {
          const body = await res.text().catch(() => "<no body>");
          console.error("[GET /api/recipes/:id] FAILED", { status: res.status, statusText: res.statusText, body });
          throw new Error(`Recept se nepodařilo načíst (HTTP ${res.status})`);
        }

        const data: Recipe = await res.json();
        setRecipe(data);
        if (email) fetchFavorites(email, data.id);
      } catch (error) {
        console.error("Chyba při načítání receptu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id, fetchFavorites]);

  // --- actions (favorite / edit / delete / approve / reject)
  const handleToggleFavorite = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token || !recipe) {
      alert("Pro přidání do oblíbených se musíte přihlásit.");
      router.push("/login");
      return;
    }
    setIsFavorite((prev) => !prev);
    try {
      const res = await fetch(`${API_URL}/api/user/favorites/${recipe.id}/toggle`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Chyba při přepínání oblíbeného receptu");
    } catch (error) {
      console.error("Chyba při přepínání oblíbených:", error);
      setIsFavorite((prev) => !prev);
      alert("Akce se nezdařila, zkuste to prosím znovu.");
    }
  };

  const handleEdit = () => {
    if (!recipe) return;
    router.push(`/recepty/${recipe.id}/upravit`);
  };

  const handleDelete = async () => {
    if (!recipe || !confirm("Opravdu chceš smazat tento recept?")) return;
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        alert("❌ Chybí token. Přihlas se znovu.");
        return;
      }
      const res = await fetch(`${API_URL}/api/recipes/${recipe.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        alert("✅ Recept smazán");
        router.push("/recepty");
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`❌ Chyba při mazání: ${errorData.message || errorData.error || "Neznámá chyba"}`);
      }
    } catch (error) {
      console.error("❌ Chyba při mazání receptu:", error);
      alert("❌ Neznámá chyba při mazání.");
    }
  };

  const handleApprove = async () => {
    if (!recipe) return;
    if (!confirm("Opravdu chceš schválit tento recept?")) return;
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        alert("Chybí token. Přihlas se znovu.");
        return;
      }
      const res = await fetch(`${API_URL}/api/recipes/${recipe.id}/approve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        alert("✅ Recept schválen");
        const refreshed = await fetch(`${API_URL}/api/recipes/${recipe.id}`);
        if (refreshed.ok) setRecipe(await refreshed.json());
        else router.refresh();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`❌ Chyba: ${err.message || "Nepodařilo se schválit"}`);
      }
    } catch (e) {
      console.error(e);
      alert("❌ Chyba při schvalování.");
    }
  };

  const handleReject = async () => {
    if (!recipe) return;
    if (!confirm("Opravdu chceš zamítnout tento recept?")) return;
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        alert("Chybí token. Přihlas se znovu.");
        return;
      }
      const res = await fetch(`${API_URL}/api/recipes/${recipe.id}/reject`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        alert("✅ Recept zamítnut");
        router.push("/admin/cekajici-recepty");
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`❌ Chyba: ${err.message || "Nepodařilo se zamítnout"}`);
      }
    } catch (e) {
      console.error(e);
      alert("❌ Chyba při zamítání.");
    }
  };

  // helpers
  const getFractionLabel = (amount: number) => {
    if (Math.abs(amount - 0.5) < 0.01) return "polovina";
    if (Math.abs(amount - 1 / 3) < 0.01) return "třetina";
    if (Math.abs(amount - 0.25) < 0.01) return "čtvrtina";
    return null;
  };

  if (loading) return <div className="text-center p-10">Načítání receptu...</div>;
  if (!recipe) return <div className="text-center p-10 text-red-600">Recept nenalezen.</div>;

  const imageUrl =
    recipe.image_url?.startsWith("http") ? recipe.image_url : recipe.image_url ? `${API_URL}${recipe.image_url}` : "/placeholder.jpg";
  const isPending = recipe.status === "PENDING";

  return (
    <div className="bg-gray-50 min-h-screen">
      <main className="max-w-5xl mx-auto">
        {/* Hlavní obrázek + tl. akce */}
        <div className="relative h-64 md:h-80 w-full rounded-b-3xl overflow-hidden shadow-lg">
          <Image src={imageUrl} alt={recipe.title} fill sizes="100vw" className="object-cover" unoptimized />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20 flex flex-col justify-end p-6 md:p-8">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-5xl font-bold text-white drop-shadow-lg">{recipe.title}</h1>
              {isPending && <span className="text-xs md:text-sm bg-yellow-400 text-gray-900 font-bold px-2 py-1 rounded">Čeká na schválení</span>}
              {recipe.status === "REJECTED" && <span className="text-xs md:text-sm bg-red-500 text-white font-bold px-2 py-1 rounded">Zamítnuto</span>}
            </div>
            {recipe.calories && recipe.calories > 0 && (
              <span className="mt-1 text-xl bg-yellow-400 text-gray-900 font-semibold px-4 py-1 rounded-full w-fit">{recipe.calories} kcal</span>
            )}
          </div>

          <div className="absolute top-4 right-4 flex gap-3">
            {userEmail && recipe.status !== "PENDING" && (
              <button
                onClick={handleToggleFavorite}
                className="bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-md hover:bg-white transition transform hover:scale-110"
                aria-label="Přidat mezi oblíbené"
              >
                <IconHeart isFavorite={isFavorite} />
              </button>
            )}

            {!adminLoading && isAdmin && (
              <>
                {isPending && (
                  <>
                    <button
                      onClick={handleApprove}
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg inline-flex items-center gap-2 transition shadow-md"
                    >
                      ✅ Schválit
                    </button>
                    <button
                      onClick={handleReject}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold px-4 py-2 rounded-lg inline-flex items-center gap-2 transition shadow-md"
                    >
                      ❌ Zamítnout
                    </button>
                  </>
                )}
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

        {/* Obsah */}
        <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ingredience */}
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-bold mb-4">Ingredience</h2>
            <ul className="space-y-3">
              {recipe.ingredients?.map((ing, i) => {
                const unit = ing.unit ?? "g";
                const amount = Number(ing.amount) || 0;
                const grams = unit === "ks" && ing.default_grams ? amount * ing.default_grams : amount;
                const kcal = Math.round(grams * (Number(ing.calories_per_gram) || 0));

                const fractionLabel = unit === "ks" ? getFractionLabel(amount) : null;
                const label =
                  ing.display && ing.display.trim() !== ""
                    ? `${ing.display} ${ing.name}`
                    : unit === "ks"
                    ? fractionLabel
                      ? `${fractionLabel} ${ing.name} (${Math.round(grams)} g)`
                      : `${amount} ks ${ing.name} (${Math.round(grams)} g)`
                    : `${amount} ${unit} ${ing.name}`;

                return (
                  <li key={i} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setModalIng({
                          name: ing.name,
                          amount,
                          unit,
                          default_grams: ing.default_grams ?? null,
                          energy_kcal_100g: ing.energy_kcal_100g ?? null,
                          proteins_100g: ing.proteins_100g ?? null,
                          carbs_100g: ing.carbs_100g ?? null,
                          sugars_100g: ing.sugars_100g ?? null,
                          fat_100g: ing.fat_100g ?? null,
                          saturated_fat_100g: ing.saturated_fat_100g ?? null,
                          fiber_100g: ing.fiber_100g ?? null,
                          sodium_100g: ing.sodium_100g ?? null,
                        });
                        setModalOpen(true);
                      }}
                      className="text-left hover:underline"
                      title="Zobrazit nutriční rozpis"
                    >
                      {label}
                    </button>
                    {kcal > 0 && <span className="text-sm font-semibold bg-yellow-100 px-2 py-1 rounded-full">{kcal} kcal</span>}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Nutriční přehled */}
          <div className="lg:col-span-2">
            {recipe.nutrition_totals ? (
              <>
                <h2 className="text-2xl font-bold mb-4">Nutriční přehled</h2>
                <NutritionDonuts totals={recipe.nutrition_totals} />
              </>
            ) : (
              <p className="text-gray-500">Nutriční přehled není k dispozici.</p>
            )}

            {recipe.notes && (
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-2">Poznámky</h3>
                <p className="text-gray-700 whitespace-pre-line bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                  {recipe.notes}
                </p>
              </div>
            )}

            {recipe.steps && recipe.steps.length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-2">Postup</h3>
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
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal s nutričním rozpadem ingredience */}
      <IngredientNutritionModal open={modalOpen} onClose={() => setModalOpen(false)} ingredient={modalIng} />
    </div>
  );
}