// 📁 backend/src/controllers/recipeController.ts
import type { Request, Response } from "express";
import {
  getAllRecipes,
  getRecipeByIdFromDB,
  createFullRecipe,
  updateRecipeInDB,
  deleteRecipeFromDB,
  getAllIngredientsFromDB,
  createIngredientInDB,
  updateIngredientInDB,
  deleteIngredientFromDB,
  getAllIngredientCategories,
  createIngredientCategory,
  updateIngredientCategory,
  deleteIngredientCategory,
  // důležité: bereme typ přímo z modelu
  type IngredientInput as ModelIngredientInput,
} from "../models/recipeModel";

// -----------------------------
// Typy
// -----------------------------
type Role = "SUPERADMIN" | "ADMIN" | "USER";

// -----------------------------
// Pomocné funkce
// -----------------------------
function ensureAdmin(req: Request, res: Response): boolean {
  const role = req.user?.role as Role | undefined;
  if (!req.user) {
    res.status(401).json({ error: "Nejste přihlášen." });
    return false;
  }
  if (!role || !["ADMIN", "SUPERADMIN"].includes(role)) {
    res.status(403).json({ error: "Přístup zamítnut. Musíte být administrátor." });
    return false;
  }
  return true;
}

function parseJSON<T>(value: unknown, fallback: T): T {
  if (typeof value === "string" && value.trim() !== "") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return (value as T) ?? fallback;
}

// ✅ Normalizace ingrediencí:
// - nikdy nevrací `id` (model ho nemá), ale doplní `ingredient_id` (z `id` nebo z `ingredient_id`)
// - `unit` je povinný string → doplníme ""
// - `calories_per_gram` je povinné číslo → doplníme 0
function processIngredients(raw: unknown): ModelIngredientInput[] {
  let arr: unknown;

  if (typeof raw === "string") {
    try {
      arr = JSON.parse(raw);
    } catch {
      throw new Error("Chybný formát ingrediencí (nevalidní JSON).");
    }
  } else {
    arr = raw;
  }

  if (!Array.isArray(arr)) {
    throw new Error("Ingredience nejsou ve správném formátu.");
  }

  return (arr as any[]).map((i) => {
    const ingredient_id =
      i.ingredient_id !== undefined
        ? Number(i.ingredient_id)
        : i.id !== undefined
        ? Number(i.id)
        : 0;

    const base: any = {
      ingredient_id, // 👈 místo `id`
      amount: Number(i.amount ?? 0),
      unit: String(i.unit ?? ""),
      calories_per_gram: Number(i.calories_per_gram ?? 0),
    };

    // volitelná pole – přidáme pouze pokud existují (ať se vyhneme excess property checku)
    if (i.category_id !== undefined) base.category_id = Number(i.category_id);
    if (i.category_name !== undefined) base.category_name = String(i.category_name);
    if (i.default_grams !== undefined && i.default_grams !== null && i.default_grams !== "")
      base.default_grams = Number(i.default_grams);
    if (i.display !== undefined) base.display = String(i.display);
    if (i.name !== undefined) base.name = String(i.name); // pokud to model umožňuje

    return base as ModelIngredientInput;
  });
}

function getUploadedImageUrl(req: Request): string | null {
  const file = req.file as (Express.Multer.File & { secure_url?: string; path?: string }) | undefined;
  return file?.secure_url || file?.path || null;
}

// -----------------------------
// CONTROLLERY PRO RECEPTY
// -----------------------------
export const getRecipes = async (_req: Request, res: Response): Promise<void> => {
  try {
    const recipes = await getAllRecipes();
    res.status(200).json(recipes);
  } catch {
    res.status(500).json({ error: "Chyba při načítání receptů." });
  }
};

export const getRecipeById = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Neplatné ID receptu." });
    return;
  }
  try {
    const recipe = await getRecipeByIdFromDB(id);
    if (!recipe) {
      res.status(404).json({ error: "Recept nenalezen." });
      return;
    }
    res.status(200).json(recipe);
  } catch {
    res.status(500).json({ error: "Chyba serveru při načítání receptu." });
  }
};

export const addRecipe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!ensureAdmin(req, res)) return;

    const { title, notes, ingredients, categories, mealTypes, steps } = req.body as {
      title?: string;
      notes?: string;
      ingredients?: unknown;
      categories?: unknown;
      mealTypes?: unknown;
      steps?: unknown;
    };

    if (!title || !ingredients || !categories || !mealTypes || !steps) {
      res.status(400).json({ error: "Chybí povinná pole." });
      return;
    }

    const parsedIngredients = processIngredients(ingredients);
    const parsedCategories = parseJSON<string[]>(categories, []);
    const parsedMealTypes = parseJSON<string[]>(mealTypes, []);
    const parsedSteps = parseJSON<string[]>(steps, []);

    const imageUrl = getUploadedImageUrl(req) ?? "";

    const recipeId = await createFullRecipe(
      title,
      notes ?? "",
      imageUrl,
      parsedMealTypes,
      parsedIngredients,
      parsedCategories,
      parsedSteps
    );

    res.status(201).json({ message: "Recept uložen.", id: recipeId });
  } catch (error) {
    res.status(500).json({
      error: "Nepodařilo se uložit recept.",
      detail: (error as Error).message,
    });
  }
};

export const updateRecipe = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Neplatné ID receptu." });
    return;
  }

  try {
    if (!ensureAdmin(req, res)) return;

    const {
      title,
      notes,
      ingredients,
      categories,
      mealTypes,
      steps,
      existingImageUrl,
    } = req.body as {
      title?: string;
      notes?: string;
      ingredients?: unknown;
      categories?: unknown;
      mealTypes?: unknown;
      steps?: unknown;
      existingImageUrl?: string | null;
    };

    if (!title || !ingredients || !categories || !mealTypes || !steps) {
      res.status(400).json({ error: "Chybí povinná pole." });
      return;
    }

    const parsedIngredients = processIngredients(ingredients);
    const parsedCategories = parseJSON<string[]>(categories, []);
    const parsedMealTypes = parseJSON<string[]>(mealTypes, []);
    const parsedSteps = parseJSON<string[]>(steps, []);

    const uploadedUrl = getUploadedImageUrl(req);
    const finalImageUrl = uploadedUrl ?? (existingImageUrl || null);

    await updateRecipeInDB(
      id,
      title,
      notes ?? "",
      finalImageUrl,
      parsedMealTypes,
      parsedIngredients,
      parsedCategories,
      parsedSteps
    );

    res.status(200).json({ message: "Recept úspěšně upraven." });
  } catch (error) {
    console.error("❌ Chyba v updateRecipe:", error);
    res.status(500).json({
      error: "Nepodařilo se upravit recept.",
      detail: (error as Error).message,
    });
  }
};

export const deleteRecipe = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Neplatné ID." });
    return;
  }
  try {
    if (!ensureAdmin(req, res)) return;

    await deleteRecipeFromDB(id);
    res.status(200).json({ message: "Recept smazán." });
  } catch {
    res.status(500).json({ error: "Nepodařilo se smazat recept." });
  }
};

// -----------------------------
// CONTROLLERY PRO SUROVINY
// -----------------------------
export const getAllIngredients = async (_req: Request, res: Response): Promise<void> => {
  try {
    const ingredients = await getAllIngredientsFromDB();
    res.status(200).json(ingredients);
  } catch {
    res.status(500).json({ error: "Chyba serveru při načítání surovin." });
  }
};

export const createIngredient = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!ensureAdmin(req, res)) return;

    const { name, category_id, calories_per_gram, default_grams, unit_name } = req.body as {
      name?: string;
      category_id?: string | number;
      calories_per_gram?: string | number;
      default_grams?: string | number | null;
      unit_name?: string | null;
    };

    if (!name || category_id === undefined || calories_per_gram === undefined) {
      res.status(400).json({ error: "Chybí povinné údaje." });
      return;
    }

    const newIngredient = await createIngredientInDB(
      name.trim(),
      Number(calories_per_gram),
      Number(category_id),
      default_grams === undefined || default_grams === null || default_grams === "" ? undefined : Number(default_grams),
      unit_name || undefined
    );

    res.status(201).json(newIngredient);
  } catch {
    res.status(500).json({ error: "Nepodařilo se přidat surovinu." });
  }
};

export const updateIngredient = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Neplatné ID suroviny." });
    return;
  }

  try {
    if (!ensureAdmin(req, res)) return;

    const { name, category_id, calories_per_gram, default_grams, unit_name } = req.body as {
      name?: string;
      category_id?: string | number;
      calories_per_gram?: string | number;
      default_grams?: string | number | null;
      unit_name?: string | null;
    };

    if (name === undefined || category_id === undefined || calories_per_gram === undefined) {
      res.status(400).json({ error: "Chybí povinné údaje." });
      return;
    }

    const parsedDefaultGrams =
      default_grams === "" || default_grams === undefined || default_grams === null ? null : Number(default_grams);
    const parsedUnitName = unit_name === "" || unit_name === undefined ? null : unit_name;

    await updateIngredientInDB(
      id,
      name.trim(),
      Number(calories_per_gram),
      Number(category_id),
      parsedDefaultGrams,
      parsedUnitName
    );

    res.status(200).json({ message: "Surovina byla úspěšně aktualizována." });
  } catch {
    res.status(500).json({ error: "Nepodařilo se upravit surovinu." });
  }
};

export const deleteIngredient = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Neplatné ID." });
    return;
  }

  try {
    if (!ensureAdmin(req, res)) return;

    const success = await deleteIngredientFromDB(id);
    if (!success) {
      res.status(404).json({ error: "Surovina nenalezena nebo již smazána." });
      return;
    }

    res.status(200).json({ message: "Surovina smazána." });
  } catch (error) {
    console.error("❌ Chyba při mazání suroviny:", error);
    res.status(500).json({ error: "Nepodařilo se smazat surovinu." });
  }
};

// -----------------------------
// CONTROLLERY PRO KATEGORIE
// -----------------------------
export const getAllCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await getAllIngredientCategories();
    res.status(200).json(categories);
  } catch {
    res.status(500).json({ error: "Chyba při načítání kategorií." });
  }
};

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!ensureAdmin(req, res)) return;

    const { name } = req.body as { name?: string };
    if (!name || typeof name !== "string") {
      res.status(400).json({ error: "Název kategorie je povinný." });
      return;
    }

    const newCategory = await createIngredientCategory(name);
    res.status(201).json(newCategory);
  } catch {
    res.status(500).json({ error: "Nepodařilo se vytvořit kategorii." });
  }
};

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Neplatné ID." });
    return;
  }
  try {
    if (!ensureAdmin(req, res)) return;

    const { name } = req.body as { name?: string };
    if (!name || typeof name !== "string") {
      res.status(400).json({ error: "Název kategorie je povinný." });
      return;
    }

    await updateIngredientCategory(id, name);
    res.status(200).json({ message: "Kategorie upravena." });
  } catch {
    res.status(500).json({ error: "Nepodařilo se upravit kategorii." });
  }
};

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Neplatné ID." });
    return;
  }
  try {
    if (!ensureAdmin(req, res)) return;

    await deleteIngredientCategory(id);
    res.status(200).json({ message: "Kategorie smazána." });
  } catch {
    res.status(500).json({ error: "Nepodařilo se smazat kategorii." });
  }
};