"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Ingredient = {
  name: string;
  amount: number;
  unit: string;
  calories_per_gram: number | string;
  display?: string | null;
  default_grams?: number;
};

type Recipe = {
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
  created_by_email?: string;
};

export default function PendingRecipeDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<"approve" | "reject" | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchRecipe = useCallback(async () => {
    if (!id || typeof id !== "string") return;
    try {
      setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_URL}/api/recipes/${id}`, { headers });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Nepodařilo se načíst recept");
      }
      const data: Recipe = await res.json();
      setRecipe(data);
    } catch (err) {
      console.error("❌ Chyba při načítání detailu:", err);
      alert("❌ Nepodařilo se načíst recept.");
      router.push("/admin/cekajici-recepty");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchRecipe();
  }, [fetchRecipe]);

  const approve = async () => {
    if (!recipe) return;
    try {
      setActionLoading("approve");
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Chybí token, přihlas se znovu.");

      const res = await fetch(`${API_URL}/api/recipes/${recipe.id}/approve`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Schválení selhalo");
      }
      alert("✅ Recept schválen.");
      router.push("/admin/cekajici-recepty");
    } catch (e) {
      alert("❌ " + (e instanceof Error ? e.message : "Neznámá chyba při schválení"));
    } finally {
      setActionLoading(null);
    }
  };

  const reject = async () => {
    if (!recipe) return;
    try {
      setActionLoading("reject");
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Chybí token, přihlas se znovu.");

      const res = await fetch(`${API_URL}/api/recipes/${recipe.id}/reject`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: rejectReason || undefined }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Zamítnutí selhalo");
      }
      alert("✅ Recept zamítnut.");
      router.push("/admin/cekajici-recepty");
    } catch (e) {
      alert("❌ " + (e instanceof Error ? e.message : "Neznámá chyba při zamítnutí"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleEdit = () => {
    if (!recipe) return;
    router.push(`/recepty/${recipe.id}/upravit`);
  };

  if (loading) return <div className="text-center p-10">Načítání…</div>;
  if (!recipe) return <div className="text-center p-10 text-red-600">Recept nenalezen.</div>;

  const imageUrl =
    recipe.image_url?.startsWith("http")
      ? recipe.image_url
      : recipe.image_url
      ? `${API_URL}${recipe.image_url}`
      : "/placeholder.jpg";

  // pomocná funkce na frakce ks
  const getFractionLabel = (amount: number) => {
    if (Math.abs(amount - 0.5) < 0.01) return "polovina";
    if (Math.abs(amount - 1 / 3) < 0.01) return "třetina";
    if (Math.abs(amount - 0.25) < 0.01) return "čtvrtina";
    return null;
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <main className="max-w-5xl mx-auto">
        <div className="relative h-64 md:h-80 w-full rounded-b-3xl overflow-hidden shadow-lg">
          <Image src={imageUrl} alt={recipe.title} fill className="object-cover" unoptimized />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20 flex flex-col justify-end p-6 md:p-8">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-5xl font-bold text-white drop-shadow-lg">{recipe.title}</h1>
              {recipe.status && (
                <span
                  className={`text-xs md:text-sm font-semibold px-3 py-1 rounded-full ${
                    recipe.status === "PENDING"
                      ? "bg-yellow-400 text-gray-900"
                      : recipe.status === "APPROVED"
                      ? "bg-green-500 text-white"
                      : "bg-red-500 text-white"
                  }`}
                >
                  {recipe.status}
                </span>
              )}
            </div>
            {recipe.calories && recipe.calories > 0 && (
              <span className="mt-2 text-xl bg-yellow-400 text-gray-900 font-semibold px-4 py-1 rounded-full w-fit">
                {recipe.calories} kcal
              </span>
            )}
          </div>

          {/* Akce moderátora */}
          <div className="absolute top-4 right-4 flex gap-3">
            <button
              onClick={handleEdit}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition shadow-md"
            >
              Upravit
            </button>
            <button
              onClick={approve}
              disabled={actionLoading === "approve"}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold px-4 py-2 rounded-lg transition shadow-md"
            >
              {actionLoading === "approve" ? "Schvaluji…" : "Schválit"}
            </button>
          </div>
        </div>

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
                      const displayExists = ing.display && ing.display.trim() !== "";
                      const label = displayExists
                        ? `${ing.display} ${ing.name}`
                        : unit === "ks"
                        ? fractionLabel
                          ? `${fractionLabel} ${ing.name} (${Math.round(grams)} g)`
                          : `${amount} ks ${ing.name} (${Math.round(grams)} g)`
                        : `${amount} ${unit} ${ing.name}`;

                      return (
                        <li key={i} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
                          <span className="text-gray-700">{label}</span>
                          {kcal > 0 && (
                            <span className="text-sm font-semibold bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                              {kcal} kcal
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {recipe.notes && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Poznámky</h2>
                  <p className="text-gray-600 whitespace-pre-line bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                    {recipe.notes}
                  </p>
                </div>
              )}

              {/* Zamítnutí s důvodem */}
              <div className="space-y-2">
                <label className="block text-sm text-gray-600">Důvod zamítnutí (volitelné)</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={2}
                  className="w-full border rounded p-2"
                  placeholder="Např. chybí fotka, nepřesné množství surovin…"
                />
                <button
                  onClick={reject}
                  disabled={actionLoading === "reject"}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold px-4 py-2 rounded-lg transition shadow-md"
                >
                  {actionLoading === "reject" ? "Zamítám…" : "Zamítnout"}
                </button>
              </div>
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