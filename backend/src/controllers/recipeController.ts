import { Request, Response } from "express";
import db from "../utils/db"; // Důležitý import pro ověření
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
} from "../models/recipeModel";

// --- Pomocná funkce pro ověření admina ---
const checkAdminPermissions = async (email: string): Promise<boolean> => {
  if (!email) return false;
  try {
    const result = await db.query("SELECT is_admin FROM users WHERE email = $1", [email]);
    return result.rows.length > 0 && result.rows[0].is_admin === true;
  } catch {
    return false;
  }
};

// --- Pomocné funkce ---
function processIngredients(rawIngredients: any): any[] {
  if (typeof rawIngredients === "string") {
    try {
      return JSON.parse(rawIngredients);
    } catch {
      throw new Error("Chybný formát ingrediencí (nevalidní JSON)");
    }
  } else if (Array.isArray(rawIngredients)) {
    return rawIngredients;
  }
  throw new Error("Ingredience nejsou ve správném formátu");
}

// --- CONTROLLERY PRO RECEPTY ---
export const getRecipes = async (_req: Request, res: Response): Promise<void> => {
  try {
    const recipes = await getAllRecipes();
    res.status(200).json(recipes);
  } catch (error) {
    res.status(500).json({ error: "Chyba při načítání receptů" });
  }
};

export const getRecipeById = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
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
  } catch (error) {
    res.status(500).json({ error: "Chyba serveru při načítání receptu." });
  }
};

export const addRecipe = async (req: Request, res: Response): Promise<void> => {
  try {
    const email = (req as any).user?.email;
    console.log("📬 Ověřovací e-mail:", email);

    const isAdmin = await checkAdminPermissions(email);
    if (!isAdmin) {
      res.status(403).json({ error: "Přístup zamítnut. Musíš být administrátor." });
      return;
    }

    const { title, notes, ingredients, categories, mealTypes, steps } = req.body;
    if (!title || !ingredients || !categories || !mealTypes || !steps) {
      res.status(400).json({ error: "Chybí povinná pole." });
      return;
    }

    const parsedIngredients = processIngredients(ingredients);
    const parsedCategories = typeof categories === "string" ? JSON.parse(categories) : categories;
    const parsedMealTypes = typeof mealTypes === "string" ? JSON.parse(mealTypes) : mealTypes;
    const parsedSteps = Array.isArray(steps) ? steps : JSON.parse(steps || "[]");

    const fileMeta = req.file as { secure_url?: string; path?: string };
    const imagePath = fileMeta?.secure_url || fileMeta?.path || "";

    const recipeId = await createFullRecipe(title, notes, imagePath, parsedMealTypes, parsedIngredients, parsedCategories, parsedSteps);

    res.status(201).json({ message: "Recept uložen", id: recipeId });
  } catch (error) {
    res.status(500).json({
      error: "Nepodařilo se uložit recept.",
      detail: (error as Error).message,
    });
  }
};

export const updateRecipe = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Neplatné ID receptu." });
    return;
  }

  try {
    // ✅ ZÍSKÁNÍ EMAILU Z req.user
    const email = (req as any).user?.email;
    console.log("📬 Ověřovací e-mail:", email);

    const isAdmin = await checkAdminPermissions(email);
    if (!isAdmin) {
      res.status(403).json({ error: "Přístup zamítnut. Musíš být administrátor." });
      return;
    }

    const { title, notes, ingredients, categories, mealTypes, steps, existingImageUrl } = req.body;
    if (!title || !ingredients || !categories || !mealTypes || !steps) {
      res.status(400).json({ error: "Chybí povinná pole." });
      return;
    }

    const parsedIngredients = processIngredients(ingredients);
    const parsedCategories = typeof categories === "string" ? JSON.parse(categories) : categories;
    const parsedMealTypes = typeof mealTypes === "string" ? JSON.parse(mealTypes) : mealTypes;
    const parsedSteps = Array.isArray(steps) ? steps : JSON.parse(steps || "[]");
    const fileMeta = req.file as { secure_url?: string; path?: string } | undefined;
    let finalImageUrl = fileMeta?.secure_url || fileMeta?.path || existingImageUrl || null;

    await updateRecipeInDB(id, title, notes, finalImageUrl, parsedMealTypes, parsedIngredients, parsedCategories, parsedSteps);
    res.status(200).json({ message: "Recept úspěšně upraven." });
  } catch (error) {
    console.error("❌ Chyba v updateRecipe:", error);
    res.status(500).json({ error: "Nepodařilo se upravit recept.", detail: (error as Error).message });
  }
};

export const deleteRecipe = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Neplatné ID." });
    return;
  }
  try {
    await deleteRecipeFromDB(id);
    res.status(200).json({ message: "Recept smazán." });
  } catch (error) {
    res.status(500).json({ error: "Nepodařilo se smazat recept." });
  }
};

// --- CONTROLLERY PRO SUROVINY (beze změny) ---
export const getAllIngredients = async (_req: Request, res: Response): Promise<void> => {
  try {
    const ingredients = await getAllIngredientsFromDB();
    res.status(200).json(ingredients);
  } catch (error) {
    res.status(500).json({ error: "Chyba serveru při načítání surovin" });
  }
};

export const createIngredient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, category_id, calories_per_gram, default_grams, unit_name } = req.body;
    if (!name || category_id === undefined || calories_per_gram === undefined) {
      res.status(400).json({ error: "Chybí povinné údeje." });
      return;
    }
    const newIngredient = await createIngredientInDB(
      name.trim(),
      Number(calories_per_gram),
      Number(category_id),
      default_grams ? Number(default_grams) : undefined,
      unit_name || undefined
    );
    res.status(201).json(newIngredient);
  } catch (error) {
    res.status(500).json({ error: "Nepodařilo se přidat surovinu." });
  }
};

export const updateIngredient = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Neplatné ID suroviny." });
    return;
  }
  try {
    const { name, category_id, calories_per_gram, default_grams, unit_name } = req.body;
    if (name === undefined || category_id === undefined || calories_per_gram === undefined) {
      res.status(400).json({ error: "Chybí povinné údeje." });
      return;
    }
    const parsedDefaultGrams = default_grams === "" || default_grams === undefined ? null : Number(default_grams);
    const parsedUnitName = unit_name === "" || unit_name === undefined ? null : unit_name;
    await updateIngredientInDB(id, name.trim(), Number(calories_per_gram), Number(category_id), parsedDefaultGrams, parsedUnitName);
    res.status(200).json({ message: "Surovina byla ústěšně aktualizována." });
  } catch (error) {
    res.status(500).json({ error: "Nepodařilo se upravit surovinu." });
  }
};

export const deleteIngredient = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Neplatné ID." });
    return;
  }

  try {
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

// --- CONTROLLERY PRO KATEGORIE (beze změny) ---
export const getAllCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await getAllIngredientCategories();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: "Chyba při načítání kategorií." });
  }
};

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== "string") {
      res.status(400).json({ error: "Název kategorie je povinný." });
      return;
    }
    const newCategory = await createIngredientCategory(name);
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ error: "Nepodařilo se vytvořit kategorii." });
  }
};

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Neplatné ID." });
    return;
  }
  try {
    const { name } = req.body;
    if (!name || typeof name !== "string") {
      res.status(400).json({ error: "Název kategorie je povinný." });
      return;
    }
    await updateIngredientCategory(id, name);
    res.status(200).json({ message: "Kategorie upravena." });
  } catch (error) {
    res.status(500).json({ error: "Nepodařilo se upravit kategorii." });
  }
};

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Neplatné ID." });
    return;
  }
  try {
    await deleteIngredientCategory(id);
    res.status(200).json({ message: "Kategorie smazána." });
  } catch (error) {
    res.status(500).json({ error: "Nepodařilo se smazat kategorii." });
  }
};
