"use client";

import { useEffect, useRef, useState } from "react";
import CategorySelector from "@/components/CategorySelector";
import MealTypeSelector from "@/components/MealTypeSelector";
import IngredientAutocomplete, {
  type IngredientAutocompleteHandle,
  type IngredientRow,
} from "@/components/IngredientAutocomplete";
import Image from "next/image";

// Helper icon component for UI elements
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
    className="feather feather-trash-2"
  >
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

export type ServingPreset = {
  label: string;
  grams: number;
  unit?: string;
  inflect?: { one?: string; few?: string; many?: string };
};

export type RecipeFormProps = {
  initialTitle?: string;
  initialNotes?: string;
  initialImageUrl?: string | null;
  initialIngredients?: IngredientRow[];
  initialCategories?: string[];
  initialMealTypes?: string[];
  initialSteps?: string[];
  initialCalories?: number;
  onSubmit: (formData: FormData) => Promise<void>;
  submitLabel?: string;
  loading?: boolean;
};

// ingredience v UI formuláři (to, co posíláš na backend)
export type IngredientInputForForm = {
  name: string;
  amount: number;
  unit: string; // "g" | "ml" | "ks" | ...
  calories_per_gram: number; // může být 0 když používáš OFF makra
  display?: string;
  default_grams?: number | null;
  selectedServingGrams?: number | null;

  // volitelná OFF makra (na 100 g)
  energy_kcal_100g?: number | null;
  proteins_100g?: number | null;
  carbs_100g?: number | null;
  sugars_100g?: number | null;
  fat_100g?: number | null;
  saturated_fat_100g?: number | null;
  fiber_100g?: number | null;
  sodium_100g?: number | null;

  // doplňky pro label
  name_genitive?: string | null;
  servingPresets?: ServingPreset[];
};

/* ========================== */
/*    GRAMY & KALORIE HELPER  */
/* ========================== */

// kategorie (pokud je ve formuláři vybíráš)
export type Category = { id: number; name: string };

// hodnoty celého formuláře receptu
export type RecipeFormValues = {
  title: string;
  notes: string;
  imageFile: File | null; // pokud uploaduješ
  mealTypes: string[];
  categories: string[];
  steps: string[];
  ingredients: IngredientInputForForm[];
};

// odpověď ze searchu ingrediencí (format=compact|full)
export type ApiIngredientSearchItem = {
  id: number;
  name: string;
  name_cs?: string | null;
  category_id?: number | null;
  unit_name?: string | null;
  default_grams?: number | null;
  calories_per_gram?: number | null;
  // makra na 100 g (když je bereš ze searchu)
  energy_kcal_100g?: number | null;
  proteins_100g?: number | null;
  carbs_100g?: number | null;
  sugars_100g?: number | null;
  fat_100g?: number | null;
  saturated_fat_100g?: number | null;
  fiber_100g?: number | null;
  sodium_100g?: number | null;
  serving_presets?: ServingPreset[] | null;
};

type MaybeNumber = number | string | null | undefined;

// sjednocený preset: umí jak (label/grams), tak alternativní (path/g)
type PresetLike =
  | { label?: string; grams?: number; unit?: string; inflect?: { one?: string; few?: string; many?: string } }
  | { path?: string; g?: number; unit?: string; inflect?: { one?: string; few?: string; many?: string } };

// IngredientRow rozšířený o volitelná pole, která může přidat autocomplete
type IngredientRowLike = IngredientRow & {
  selectedServingGrams?: number | null;
  selectedPresetGrams?: number | null;
  selected_preset_grams?: number | null;
  presetGrams?: number | null;
  grams_per_piece?: number | null;
  g_per_piece?: number | null;

  servingPresets?: ServingPreset[] | null | undefined; // standardní
  __presets?: PresetLike[] | null | undefined; // alternativní

  selectedPresetIndex?: number | null;
  __selectedPresetIndex?: number | null;
  selectedPresetLabel?: string;

  // volitelné doplňky
  off_id?: string | null;

  energy_kcal_100g?: number | null;
  proteins_100g?: number | null;
  carbs_100g?: number | null;
  sugars_100g?: number | null;
  fat_100g?: number | null;
  saturated_fat_100g?: number | null;
  fiber_100g?: number | null;
  sodium_100g?: number | null;
};

// normalizace pro porovnání labelů presetů
const normalize = (s: string) =>
  String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

/** Vrátí g/ks s prioritou:
 *  1) vybraný preset (různá pole včetně __presets + __selectedPresetIndex)
 *  2) vybraný label / fallback „stroužek/clove“
 *  3) až potom default_grams
 */
function getPresetGramsForRow(ing: IngredientRow | IngredientRowLike): number | null {
  const x = ing as IngredientRowLike;

  // 1) explicitní vybrané hodnoty
  const chosenCandidates: MaybeNumber[] = [
    x?.selectedServingGrams,
    x?.selectedPresetGrams,
    x?.selected_preset_grams,
    x?.presetGrams,
    x?.grams_per_piece,
    x?.g_per_piece,
  ];
  for (const c of chosenCandidates) {
    const n = Number(c);
    if (Number.isFinite(n) && n > 0) return n;
  }

  // 2) seznam presetů – standardní i "__" pole
  const presets: PresetLike[] =
    (Array.isArray(x?.servingPresets) ? (x?.servingPresets as PresetLike[]) : []) ??
    (Array.isArray(x?.__presets) ? (x?.__presets as PresetLike[]) : []) ??
    [];

  if (presets.length) {
    // 2a) vybraný index – podporuj i "__selectedPresetIndex"
    const idx = x?.selectedPresetIndex ?? x?.__selectedPresetIndex;
    if (idx != null) {
      const i = Number(idx);
      const p = presets[i];
      const g = (p && ("grams" in p ? p.grams : "g" in p ? p.g : undefined)) ?? 0;
      if (Number(g) > 0) return Number(g);
    }
    // 2b) vybraný label
    if (x?.selectedPresetLabel) {
      const want = normalize(x.selectedPresetLabel);
      const hit = presets.find((p) => {
        const lbl = "label" in p ? p.label : "path" in p ? p.path : "";
        return normalize(lbl ?? "") === want;
      });
      const g = (hit && ("grams" in hit ? hit.grams : "g" in hit ? hit.g : undefined)) ?? 0;
      if (Number(g) > 0) return Number(g);
    }
    // 2c) fallback – „stroužek/clove“
    const garlic = presets.find((p) => {
      const lbl = "label" in p ? p.label : "path" in p ? p.path : "";
      const n = normalize(lbl ?? "");
      return n.includes("strouzek") || n.includes("strouz") || n.includes("clove");
    });
    const gGarlic = (garlic && ("grams" in garlic ? garlic.grams : "g" in garlic ? garlic.g : undefined)) ?? 0;
    if (Number(gGarlic) > 0) return Number(gGarlic);
  }

  // 3) až nakonec default_grams
  const d = (ing as { default_grams?: number | null })?.default_grams;
  if (d != null && Number(d) > 0) return Number(d);

  return null;
}

function getRowGrams(ing: IngredientRow | IngredientRowLike): number {
  const unit = String((ing as IngredientRow)?.unit ?? "g").toLowerCase();
  const amount = Number((ing as IngredientRow)?.amount ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) return 0;

  if (unit === "g" || unit === "ml") return amount;

  const gramsPerPiece =
    getPresetGramsForRow(ing) ??
    (Number((ing as IngredientRow)?.default_grams) > 0 ? Number((ing as IngredientRow).default_grams) : null);

  return gramsPerPiece && gramsPerPiece > 0 ? amount * gramsPerPiece : 0;
}

function calcTotalCalories(rows: Array<IngredientRow | IngredientRowLike>): number {
  return Math.round(
    rows.reduce((sum, ing) => {
      const grams = getRowGrams(ing);
      const calPerGram = Number((ing as IngredientRow)?.calories_per_gram ?? 0) || 0;
      return sum + grams * calPerGram;
    }, 0)
  );
}

/* ========================== */

export default function RecipeForm({
  initialTitle = "",
  initialNotes = "",
  initialIngredients = [],
  initialImageUrl = null,
  initialCategories = [],
  initialMealTypes = [],
  initialSteps = [],
  initialCalories = 0,

  onSubmit,
  submitLabel = "Přidat recept",
  loading = false,
}: RecipeFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialImageUrl);
  const [categories, setCategories] = useState<string[]>(initialCategories);
  const [mealTypes, setMealTypes] = useState<string[]>(initialMealTypes ?? []);
  const [steps, setSteps] = useState<string[]>(initialSteps.length ? initialSteps : [""]);
  const [submitting, setSubmitting] = useState(false);

  const ingredientRef = useRef<IngredientAutocompleteHandle>(null);

  useEffect(() => {
    setImagePreview(initialImageUrl || null);
  }, [initialImageUrl]);

  /* --------- Přepočet kcal z reálných gramů (včetně presetů) ---------- */
  const [calories, setCalories] = useState<number>(initialCalories ?? 0);

  useEffect(() => {
    setCalories(calcTotalCalories(initialIngredients ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleCategory = (cat: string) => {
    setCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  };

  const toggleMealType = (type: string) => {
    setMealTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const rows = ingredientRef.current?.getIngredients() || [];
    if (rows.length === 0) {
      alert("Musíš zadat alespoň jednu surovinu.");
      setSubmitting(false);
      return;
    }

    // čisté ingredience pro POST/PUT
    const ingredients: IngredientRow[] = rows.map((ing) => ({
      ...ing,
      calories_per_gram: Number(ing.calories_per_gram || 0),
      amount: Number(ing.amount || 0),
      default_grams:
        ing.default_grams === undefined || ing.default_grams === null
          ? undefined
          : Number(ing.default_grams),
    }));

    const formData = new FormData();
    formData.append("title", title.trim());
    const cleanedNotes = typeof notes === "string" ? notes.trim() : "";
    if (cleanedNotes) formData.append("notes", cleanedNotes);

    ingredients.forEach((ing, i) => {
      formData.append(`ingredients[${i}][name]`, ing.name ?? "");
      formData.append(`ingredients[${i}][amount]`, String(ing.amount ?? 0));
      formData.append(`ingredients[${i}][unit]`, ing.unit ?? "g");
      formData.append(`ingredients[${i}][calories_per_gram]`, String(ing.calories_per_gram ?? 0));

      // vybraný preset (má přednost před default_grams)
      const perPiece = getPresetGramsForRow(ing);
      if (Number(perPiece) > 0) {
        formData.append(`ingredients[${i}][selectedServingGrams]`, String(perPiece));
      }

      if (ing.default_grams != null) {
        formData.append(`ingredients[${i}][default_grams]`, String(ing.default_grams));
      }
      if (ing.display) {
        formData.append(`ingredients[${i}][display]`, ing.display);
      }

      // OFF ID + makra (na 100 g) — volitelné
      const maybe = ing as Partial<IngredientRowLike>;
      if (maybe.off_id) {
        formData.append(`ingredients[${i}][off_id]`, String(maybe.off_id));
      }

      formData.append(`ingredients[${i}][energy_kcal_100g]`,   maybe.energy_kcal_100g   == null ? "" : String(maybe.energy_kcal_100g));
      formData.append(`ingredients[${i}][proteins_100g]`,      maybe.proteins_100g      == null ? "" : String(maybe.proteins_100g));
      formData.append(`ingredients[${i}][carbs_100g]`,         maybe.carbs_100g         == null ? "" : String(maybe.carbs_100g));
      formData.append(`ingredients[${i}][sugars_100g]`,        maybe.sugars_100g        == null ? "" : String(maybe.sugars_100g));
      formData.append(`ingredients[${i}][fat_100g]`,           maybe.fat_100g           == null ? "" : String(maybe.fat_100g));
      formData.append(`ingredients[${i}][saturated_fat_100g]`, maybe.saturated_fat_100g == null ? "" : String(maybe.saturated_fat_100g));
      formData.append(`ingredients[${i}][fiber_100g]`,         maybe.fiber_100g         == null ? "" : String(maybe.fiber_100g));
      formData.append(`ingredients[${i}][sodium_100g]`,        maybe.sodium_100g        == null ? "" : String(maybe.sodium_100g));

      // (volitelné) Pošli i presety v jednotném tvaru – hodí se pro klientský detail/modál
      const presetsRaw = Array.isArray(maybe.__presets) ? maybe.__presets : null;
      if (presetsRaw) {
        const normalized = presetsRaw.map((p) => ({
          label: String(("label" in p ? p.label : "path" in p ? p.path : "") ?? ""),
          grams: Number(("grams" in p ? p.grams : "g" in p ? p.g : 0)) || 0,
          unit: ("unit" in p && p.unit) ? p.unit : "ks",
        }));
        formData.append(`ingredients[${i}][servingPresets]`, JSON.stringify(normalized));
      }
    });

    formData.append("categories", JSON.stringify(categories));
    formData.append("mealTypes", JSON.stringify(mealTypes));
    formData.append("steps", JSON.stringify(steps.filter((s) => s.trim() !== "")));
    if (Number.isFinite(calories)) formData.append("calories", String(calories));

    if (imageFile instanceof File) {
      formData.append("image", imageFile);
    } else if (initialImageUrl) {
      formData.append("existingImageUrl", initialImageUrl);
    }

    const userEmail = typeof window !== "undefined" ? localStorage.getItem("userEmail") : null;
    if (userEmail) formData.append("email", userEmail);

    await onSubmit(formData);
    setSubmitting(false);
  };

  const currentImage = imagePreview || "/placeholder.jpg";

  return (
    <form
      onSubmit={handleFormSubmit}
      className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg space-y-8 max-w-4xl mx-auto"
      encType="multipart/form-data"
    >
      {/* --- HLAVIČKA --- */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Základní informace</h2>
        <p className="text-gray-500 text-sm mt-1">Pojmenuj svůj recept a přidej krátký popis.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Název receptu (např. Špagety Carbonara)"
          required
          className="md:col-span-9 p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
        />
        <input
          type="number"
          value={Number.isFinite(calories) ? calories : ""}
          disabled
          readOnly
          placeholder="kcal"
          className="md:col-span-3 p-3 border border-gray-300 rounded-lg w-full bg-gray-100 text-center font-bold"
        />
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Krátký popis nebo poznámky k receptu..."
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
        rows={3}
      />

      {/* --- KATEGORIZACE --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6 border-t">
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Typ chodu</h3>
          <MealTypeSelector selected={mealTypes} onToggle={toggleMealType} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Kategorie</h3>
          <CategorySelector selected={categories} onToggle={toggleCategory} />
        </div>
      </div>

      {/* --- OBRÁZEK --- */}
      <div className="pt-6 border-t">
        <h2 className="text-2xl font-bold text-gray-800">Obrázek</h2>
        <p className="text-gray-500 text-sm mt-1">Nahraj fotku hotového jídla.</p>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setImageFile(file);
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => setImagePreview(reader.result as string);
                reader.readAsDataURL(file);
              } else {
                setImagePreview(initialImageUrl || null);
              }
            }}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
          />
          <div className="relative w-full h-40 rounded-lg overflow-hidden border">
            <Image
              src={currentImage}
              alt="Náhled obrázku"
              fill
              unoptimized
              onError={() => setImagePreview(null)}
              className="object-cover"
            />
          </div>
        </div>
      </div>

      {/* --- INGREDIENCE --- */}
      <div className="pt-6 border-t">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Ingredience</h2>
            <p className="text-gray-500 text-sm mt-1">
              Přidej všechny potřebné suroviny a jejich množství.
            </p>
          </div>
        </div>

        <div className="mt-4">
          <IngredientAutocomplete
            ref={ingredientRef}
            initialIngredients={initialIngredients}
            onChange={(rows: IngredientRow[]) => setCalories(calcTotalCalories(rows))}
          />
        </div>
      </div>

      {/* --- POSTUP --- */}
      <div className="pt-6 border-t">
        <h2 className="text-2xl font-bold text-gray-800">Postup</h2>
        <p className="text-gray-500 text-sm mt-1">Popiš jednotlivé kroky přípravy.</p>
        <div className="mt-4 space-y-4">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white flex items-center justify-center rounded-full font-bold text-sm">
                {index + 1}
              </div>
              <textarea
                value={step}
                onChange={(e) => {
                  const newSteps = [...steps];
                  newSteps[index] = e.target.value;
                  setSteps(newSteps);
                }}
                placeholder={`Popis ${index + 1}. kroku`}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                rows={2}
              />
              <button
                type="button"
                onClick={() => setSteps(steps.filter((_, i) => i !== index))}
                className="flex-shrink-0 text-gray-400 hover:text-red-500 transition p-2"
                title="Smazat krok"
              >
                <IconTrash />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setSteps([...steps, ""])}
            className="bg-blue-100 text-blue-800 hover:bg-blue-200 font-semibold px-4 py-2 rounded-lg text-sm transition"
          >
            ➕ Přidat další krok
          </button>
        </div>
      </div>

      {/* --- ODESLÁNÍ --- */}
      <div className="pt-6 border-t flex justify-end">
        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 rounded-lg transition-transform transform hover:scale-105"
          disabled={submitting || loading}
        >
          {submitting ? "Ukládám..." : submitLabel}
        </button>
      </div>
    </form>
  );
}