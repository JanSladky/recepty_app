"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import useAdmin from "@/hooks/useAdmin";
import NutritionPie from "@/components/NutritionPie";
import dynamic from "next/dynamic";
import { formatIngredientLabel } from "../../utils/labels";

import type { IngredientForModal } from "@/components/IngredientNutritionModal";
const IngredientNutritionModal = dynamic(() => import("@/components/IngredientNutritionModal"), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

/* ---------- Ikony ---------- */
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

/* ---------- Typy od backendu ---------- */
export type ServingPreset = {
  label: string;
  grams: number;
  unit?: string;
  inflect?: { one?: string; few?: string; many?: string };
};

export type IngredientInput = {
  id?: number; // může přijít
  ingredient_id?: number; // může přijít
  name: string;
  amount: number;
  unit: string;
  calories_per_gram: number;
  display?: string;
  default_grams?: number | null;
  selectedServingGrams?: number | null;

  // makra na 100 g
  energy_kcal_100g?: number | null;
  proteins_100g?: number | null;
  carbs_100g?: number | null;
  sugars_100g?: number | null;
  fat_100g?: number | null;
  saturated_fat_100g?: number | null;
  fiber_100g?: number | null;
  sodium_100g?: number | null;

  name_genitive?: string | null;

  // může přijít jako camel i snake:
  servingPresets?: ServingPreset[];
  serving_presets?: ServingPreset[];

  // rozšířené položky (na 100 g)
  trans_fat_100g?: number | null;
  mono_fat_100g?: number | null;
  poly_fat_100g?: number | null;
  cholesterol_mg_100g?: number | null;
  salt_100g?: number | null;
  calcium_mg_100g?: number | null;
  water_100g?: number | null;
  phe_mg_100g?: number | null;
};

export type NutritionTotals = {
  kcal: number;
  proteins: number;
  carbs: number;
  sugars: number;
  fat: number;
  saturated_fat: number;
  fiber: number;
  sodium: number;
};

export type Recipe = {
  id: number;
  title: string;
  notes?: string | null;
  image_url?: string | null;
  steps?: string[];
  status?: "APPROVED" | "PENDING" | "REJECTED";
  created_by?: number | null;
  categories?: string[];
  meal_types?: string[];
  ingredients?: IngredientInput[];
  calories?: number;
  nutrition_totals?: NutritionTotals;
};

// NOVĚ – pokrývá id, ingredient_id, ingredientId i vnořený tvar ingredient.id
const getIngredientId = (ing: Partial<IngredientInput> & { ingredient?: { id?: number } }): number | undefined => {
  const raw =
    ing.ingredient_id ??
    (ing as { ingredientId?: number }).ingredientId ?? // pro jistotu kompatibilita
    ing.id ??
    ing.ingredient?.id ??
    null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
};

const nz = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

/** Minimální tvar pro odhad porce */
type IngredientForGuess = Pick<IngredientInput, "display" | "name" | "selectedServingGrams">;

/** Fallback: když v JSONu není selectedServingGrams, zkus uhodnout 3 g/ks z textu. */
function guessSelectedServingGrams(ing: IngredientForGuess): number | null {
  if (typeof ing.selectedServingGrams === "number" && ing.selectedServingGrams > 0) return ing.selectedServingGrams;
  const text = normalize(`${ing.display ?? ""} ${ing.name ?? ""}`);
  if (text.includes("strouzek") || text.includes("strouz") || text.includes("clove")) return 3;
  return null;
}

/** Přepočet ks→g: priorita selectedServingGrams → default_grams → 0 */
function computeGrams(amount: number, unit: string, selectedServingGrams?: number | null, default_grams?: number | null) {
  const a = nz(amount);
  const u = String(unit || "g").toLowerCase();
  if (!a) return 0;
  if (u === "g" || u === "ml") return a;
  if (u === "ks") {
    const per = nz(selectedServingGrams) > 0 ? nz(selectedServingGrams) : nz(default_grams);
    return per > 0 ? a * per : 0;
  }
  return 0;
}

/* ---- Dostažení doplňků (serving_presets / default_grams / name_genitive) pro ingredienci ---- */
type IngredientExtras = {
  servingPresets: ServingPreset[];
  default_grams: number | null;
  name_genitive: string | null;
};
type IngredientExtrasAPI = {
  serving_presets?: ServingPreset[] | null;
  servingPresets?: ServingPreset[] | null;
  default_grams?: number | null;
  name_genitive?: string | null;
};

async function fetchIngredientExtras(id: number): Promise<IngredientExtras | null> {
  try {
    const res = await fetch(`${API_URL}/api/ingredients/${id}?format=full`);
    if (!res.ok) return null;
    const j: IngredientExtrasAPI = await res.json();

    // sjednotíme presety do camelCase
    const presets = (Array.isArray(j.serving_presets) ? j.serving_presets : null) ?? (Array.isArray(j.servingPresets) ? j.servingPresets : null) ?? [];

    return {
      servingPresets: presets,
      default_grams: j.default_grams ?? null,
      name_genitive: j.name_genitive ?? null,
    };
  } catch {
    return null;
  }
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

  const [modalOpen, setModalOpen] = useState(false);
  const [modalIng, setModalIng] = useState<IngredientForModal | null>(null);

  const fetchFavorites = useCallback(async (_email: string, recipeId: number) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/user/favorites`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data: Array<{ id: number }> = await res.json();
        const favoriteIds = Array.isArray(data) ? data.map((r) => r.id) : [];
        setIsFavorite(favoriteIds.includes(recipeId));
      }
    } catch (error) {
      console.error("Chyba při načítání oblíbených receptů:", error);
    }
  }, []);

  useEffect(() => {
    const email = typeof window !== "undefined" ? localStorage.getItem("userEmail") : null;
    setUserEmail(email || null);

    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
        const res = await fetch(`${API_URL}/api/recipes/${id}`, { headers });
        if (!res.ok) throw new Error(`Recept se nepodařilo načíst (HTTP ${res.status})`);

        const data: Recipe = await res.json();

        // 🔧 HYDRATACE: doplň chybějící presety a související pole pro každou ingredienci
        if (Array.isArray(data.ingredients) && data.ingredients.length) {
          const hydrated = await Promise.all(
            data.ingredients.map(async (ing: IngredientInput) => {
              const hasPresets =
                (Array.isArray(ing.servingPresets) && ing.servingPresets.length > 0) || (Array.isArray(ing.serving_presets) && ing.serving_presets.length > 0);

              const iid = getIngredientId(ing);
              if (hasPresets || !iid) return ing;

              const extra = await fetchIngredientExtras(iid);
              if (!extra) return ing;

              return {
                ...ing,
                servingPresets: extra.servingPresets, // camelCase pro UI
                default_grams: ing.default_grams ?? extra.default_grams ?? null,
                name_genitive: ing.name_genitive ?? extra.name_genitive ?? null,
              };
            })
          );

          data.ingredients = hydrated as IngredientInput[];
        }

        setRecipe(data);
        if (email) fetchFavorites(email, data.id);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, fetchFavorites]);

  const handleToggleFavorite = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token || !recipe) {
      alert("Pro přidání do oblíbených se musíte přihlásit.");
      router.push("/login");
      return;
    }
    setIsFavorite((p) => !p);
    try {
      const res = await fetch(`${API_URL}/api/user/favorites/${recipe.id}/toggle`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Chyba při přepínání oblíbeného receptu");
    } catch (e) {
      console.error(e);
      setIsFavorite((p) => !p);
      alert("Akce se nezdařila, zkuste to prosím znovu.");
    }
  };

  const handleEdit = () => recipe && router.push(`/recepty/${recipe.id}/upravit`);

  const handleDelete = async () => {
    if (!recipe || !confirm("Opravdu chceš smazat tento recept?")) return;
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) return alert("❌ Chybí token. Přihlas se znovu.");
      const res = await fetch(`${API_URL}/api/recipes/${recipe.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        alert("✅ Recept smazán");
        router.push("/recepty");
      } else {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        alert(`❌ Chyba při mazání: ${err.message || "Neznámá chyba"}`);
      }
    } catch (e) {
      console.error(e);
      alert("❌ Neznámá chyba při mazání.");
    }
  };

  const handleApprove = async () => {
    if (!recipe) return;
    if (!confirm("Opravdu chceš schválit tento recept?")) return;
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) return alert("Chybí token. Přihlas se znovu.");
      const res = await fetch(`${API_URL}/api/recipes/${recipe.id}/approve`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        alert("✅ Recept schválen");
        const refreshed = await fetch(`${API_URL}/api/recipes/${recipe.id}`);
        if (refreshed.ok) setRecipe(await refreshed.json());
        else router.refresh();
      } else {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
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
      if (!token) return alert("Chybí token. Přihlas se znovu.");
      const res = await fetch(`${API_URL}/api/recipes/${recipe.id}/reject`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        alert("✅ Recept zamítnut");
        router.push("/admin/cekajici-recepty");
      } else {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        alert(`❌ Chyba: ${err.message || "Nepodařilo se zamítnout"}`);
      }
    } catch (e) {
      console.error(e);
      alert("❌ Chyba při zamítání.");
    }
  };

  if (loading) return <div className="text-center p-10">Načítání receptu...</div>;
  if (!recipe) return <div className="text-center p-10 text-red-600">Recept nenalezen.</div>;

  const imageUrl = recipe.image_url?.startsWith("http") ? recipe.image_url : recipe.image_url ? `${API_URL}${recipe.image_url}` : "/placeholder.jpg";
  const isPending = recipe.status === "PENDING";

  const totals = {
    kcal: Number(recipe?.nutrition_totals?.kcal ?? recipe?.calories) || 0,
    proteins: Number(recipe?.nutrition_totals?.proteins) || 0,
    carbs: Number(recipe?.nutrition_totals?.carbs) || 0,
    sugars: Number(recipe?.nutrition_totals?.sugars) || 0,
    fat: Number(recipe?.nutrition_totals?.fat) || 0,
    saturated_fat: Number(recipe?.nutrition_totals?.saturated_fat) || 0,
    fiber: Number(recipe?.nutrition_totals?.fiber) || 0,
    sodium: Number(recipe?.nutrition_totals?.sodium) || 0,
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <main className="max-w-6xl mx-auto">
        {/* === HERO === */}
        <div className="relative h-64 md:h-80 w-full rounded-b-3xl overflow-hidden shadow-lg">
          <Image src={imageUrl} alt={recipe.title} fill sizes="100vw" className="object-cover" unoptimized />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20 flex flex-col justify-end p-6 md:p-8">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-5xl font-bold text-white">{recipe.title}</h1>
              {isPending && <span className="text-xs md:text-sm bg-yellow-400 text-gray-900 font-bold px-2 py-1 rounded">Čeká na schválení</span>}
              {recipe.status === "REJECTED" && <span className="text-xs md:text-sm bg-red-500 text-white font-bold px-2 py-1 rounded">Zamítnuto</span>}
            </div>
            {recipe.calories && recipe.calories > 0 && (
              <span className="mt-1 text-xl bg-yellow-400 text-gray-900 font-semibold px-4 py-1 rounded-full w-fit">{recipe.calories} kcal</span>
            )}
          </div>

          {/* Akce */}
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

        {/* === OBSAH === */}
        <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Postup */}
          <section className="lg:col-span-8">
            <h2 className="text-2xl font-bold mb-4">Postup</h2>
            <ol className="space-y-6">
              {recipe.steps?.map((step, i) => (
                <li key={i} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-600 text-white font-bold text-lg rounded-full flex items-center justify-center shadow">
                    {i + 1}
                  </div>
                  <p className="text-gray-700 pt-2 leading-relaxed">{step}</p>
                </li>
              ))}
            </ol>

            {recipe.notes && (
              <div className="mt-8 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                <h3 className="text-lg font-semibold mb-1">Poznámky</h3>
                <p className="text-gray-700 whitespace-pre-line">{recipe.notes}</p>
              </div>
            )}

            {/* Nutriční přehled */}
            <div className="mt-10">
              <h2 className="text-xl font-bold mb-3">Nutriční přehled</h2>
              {recipe.nutrition_totals ? (
                <NutritionPie totals={totals} />
              ) : (
                <div className="bg-white rounded-xl shadow p-6 text-gray-500">Nutriční přehled není k dispozici.</div>
              )}
            </div>
          </section>

          {/* Ingredience */}
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-6">
              <h2 className="text-2xl font-bold mb-4">Ingredience</h2>

              <ul className="space-y-3">
                {recipe.ingredients?.map((ing, i) => {
                  const unit = ing.unit ?? "g";
                  const amount = nz(ing.amount);

                  // 1) hodnota z API (pokud existuje) → jinak chytrý odhad
                  const selected =
                    typeof ing.selectedServingGrams === "number"
                      ? ing.selectedServingGrams
                      : guessSelectedServingGrams({ name: ing.name, display: ing.display, selectedServingGrams: ing.selectedServingGrams });

                  // 2) gramáž (pro 'ks' použij vybranou/odhadovanou porci nebo default_grams)
                  const grams = unit === "ks" ? computeGrams(amount, unit, selected, ing.default_grams ?? null) : amount;

                  // 3) badge kcal
                  const kcal = Math.round(nz(ing.calories_per_gram) * grams);

                  // 4) presety – camel i snake
                  const servingPresets: ServingPreset[] = Array.isArray(ing.servingPresets)
                    ? ing.servingPresets
                    : Array.isArray(ing.serving_presets)
                    ? ing.serving_presets
                    : [];

                  const chosenPreset = selected && servingPresets.length ? servingPresets.find((p) => Math.round(p.grams) === Math.round(selected)) : undefined;

                  // 5) text přes helper
                  const label = formatIngredientLabel({
                    amount,
                    unit,
                    name: ing.name,
                    nameGenitive: ing.name_genitive ?? null,
                    gramsRounded: unit === "ks" ? Math.round(grams) : null,
                    selectedPresetLabel: chosenPreset?.label ?? null,
                    selectedPresetInflect: chosenPreset?.inflect ?? null,
                  });

                  return (
                    <li key={i} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm hover:shadow transition">
                      <button
                        type="button"
                        onClick={() => {
                          const selectedGuess = guessSelectedServingGrams({
                            name: ing.name,
                            display: ing.display,
                            selectedServingGrams: ing.selectedServingGrams,
                          });

                          const modalPayload: IngredientForModal = {
                            id: getIngredientId(ing), // ✅ důležité pro dofetch v modalu
                            name: ing.name,
                            amount,
                            unit,

                            default_grams: ing.default_grams != null ? Number(ing.default_grams) : null,
                            selectedServingGrams:
                              typeof ing.selectedServingGrams === "number" ? ing.selectedServingGrams : selectedGuess != null ? selectedGuess : null,

                            servingPresets,
                            name_genitive: ing.name_genitive ?? null,

                            energy_kcal_100g: ing.energy_kcal_100g ?? null,
                            proteins_100g: ing.proteins_100g ?? null,
                            carbs_100g: ing.carbs_100g ?? null,
                            sugars_100g: ing.sugars_100g ?? null,
                            fat_100g: ing.fat_100g ?? null,
                            saturated_fat_100g: ing.saturated_fat_100g ?? null,
                            fiber_100g: ing.fiber_100g ?? null,
                            sodium_100g: ing.sodium_100g ?? null,

                            trans_fat_100g: ing.trans_fat_100g ?? null,
                            mono_fat_100g: ing.mono_fat_100g ?? null,
                            poly_fat_100g: ing.poly_fat_100g ?? null,
                            cholesterol_mg_100g: ing.cholesterol_mg_100g ?? null,
                            salt_100g: ing.salt_100g ?? null,
                            calcium_mg_100g: ing.calcium_mg_100g ?? null,
                            water_100g: ing.water_100g ?? null,
                            phe_mg_100g: ing.phe_mg_100g ?? null,
                          };
                          console.log("[ING → MODAL payload]", {
                            from: ing,
                            id: getIngredientId(ing),
                            name: ing.name,
                          });
                          setModalIng(modalPayload);
                          setModalOpen(true);
                        }}
                        className="text-left hover:underline"
                        title="Zobrazit nutriční rozpis"
                      >
                        {label}
                      </button>
                      {kcal > 0 && <span className="text-xs font-semibold bg-yellow-100 text-gray-800 px-2 py-1 rounded-full">{kcal} kcal</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>
        </div>
      </main>

      {modalOpen && modalIng && (
        <IngredientNutritionModal
          key={modalIng.id ?? modalIng.name} // ✅ preferuj id, ať se modal správně remountne
          open
          onClose={() => setModalOpen(false)}
          ingredient={modalIng}
        />
      )}
    </div>
  );
}
