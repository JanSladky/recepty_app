import { Request, Response } from "express";
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
} from "../models/recipeModel";

// Převodní tabulka jednotek na gramy.
const UNIT_CONVERSIONS: Record<string, number> = {
  lžíce: 10,
  lžička: 5,
  šálek: 240,
  hrnek: 240,
  ks: 50,
};

function normalizeIngredientUnit(ingredient: any): { amount: number; unit: string; display: string } {
  const rawAmount = Number(ingredient.amount);
  const rawUnit = (ingredient.unit || "").toString().trim().toLowerCase();

  if (!rawUnit || rawUnit === "g") {
    return {
      amount: rawAmount,
      unit: "g",
      display: `${rawAmount} g`,
    };
  }

  const conversion = UNIT_CONVERSIONS[rawUnit];
  if (!conversion || isNaN(conversion)) {
    return {
      amount: rawAmount,
      unit: rawUnit,
      display: `${rawAmount} ${rawUnit}`,
    };
  }

  return {
    amount: rawAmount * conversion,
    unit: "g",
    display: `${rawAmount} ${rawUnit}`,
  };
}

function processIngredients(rawIngredients: any): any[] {
  let parsed: any[];

  if (typeof rawIngredients === "string") {
    try {
      parsed = JSON.parse(rawIngredients);
    } catch {
      throw new Error("Chybný formát ingrediencí (nevalidní JSON)");
    }
  } else if (Array.isArray(rawIngredients)) {
    parsed = rawIngredients;
  } else {
    throw new Error("Ingredience nejsou ve správném formátu");
  }

  return parsed.map((ing: any) => {
    const { amount, unit, calories_per_gram, name } = ing;

    if (typeof ing.display === "string" && ing.display.trim() !== "") {
      return {
        name,
        amount: Number(amount),
        unit,
        calories_per_gram: Number(calories_per_gram),
        display: ing.display.trim(),
      };
    }

    const norm = normalizeIngredientUnit(ing);
    return {
      name,
      amount: norm.amount,
      unit: norm.unit,
      calories_per_gram: Number(calories_per_gram),
      display: norm.display,
    };
  });
}

// ✅ Recepty
export const addFullRecipe = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, notes, ingredients, categories, mealType, steps, calories } = req.body;

    if (!title || !ingredients || !categories || !mealType || !steps) {
      res.status(400).json({ error: "Chybí povinná pole." });
      return;
    }

    const parsedIngredients = processIngredients(ingredients);
    const parsedCategories = JSON.parse(categories);
    const parsedMealTypes = JSON.parse(mealType);
    const parsedSteps = Array.isArray(steps) ? steps : JSON.parse(steps || "[]");
    const parsedCalories = calories ? Number(calories) : null;

    const fileMeta = req.file as { secure_url?: string; path?: string };
    const imagePath = fileMeta?.secure_url || fileMeta?.path || "";

    const recipeId = await createFullRecipe(title, notes, imagePath, parsedMealTypes, parsedIngredients, parsedCategories, parsedSteps, parsedCalories);

    res.status(201).json({ message: "Recept uložen", id: recipeId });
  } catch (error) {
    console.error("❌ Chyba při ukládání receptu:", error);
    res.status(500).json({ error: "Nepodařilo se uložit recept.", detail: (error as Error).message });
  }
};

export const updateRecipe = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Neplatné ID receptu." });
    return;
  }

  try {
    const { title, notes, ingredients, categories, mealType, steps, calories, existingImageUrl } = req.body;

    if (!title || !ingredients || !categories || !mealType || !steps) {
      res.status(400).json({ error: "Chybí povinná pole." });
      return;
    }

    const parsedIngredients = processIngredients(ingredients);
    const parsedCategories = JSON.parse(categories);
    const parsedMealTypes = JSON.parse(mealType);
    const parsedSteps = Array.isArray(steps) ? steps : JSON.parse(steps || "[]");
    const parsedCalories = calories ? Number(calories) : null;

    const fileMeta = req.file as { secure_url?: string; path?: string } | undefined;
    let finalImageUrl = fileMeta?.secure_url || fileMeta?.path || existingImageUrl || null;
    if (typeof finalImageUrl === "string" && (!finalImageUrl.trim() || finalImageUrl === "null")) {
      finalImageUrl = null;
    }

    await updateRecipeInDB(id, title, notes, finalImageUrl, parsedMealTypes, parsedIngredients, parsedCategories, parsedSteps, parsedCalories);

    res.status(200).json({ message: "Recept úspěšně upraven." });
  } catch (error) {
    console.error("❌ Chyba při update receptu:", error);
    res.status(500).json({ error: "Nepodařilo se upravit recept.", detail: (error as Error).message });
  }
};

export const getRecipes = async (_req: Request, res: Response): Promise<void> => {
  try {
    const recipes = await getAllRecipes();
    res.status(200).json(recipes);
  } catch (error) {
    console.error("❌ Chyba při načítání receptů:", error);
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
    console.error("❌ Chyba při načítání detailu receptu:", error);
    res.status(500).json({ error: "Chyba serveru při načítání receptu." });
  }
};

export const deleteRecipe = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Neplatné ID receptu." });
    return;
  }

  try {
    await deleteRecipeFromDB(id);
    res.status(200).json({ message: "Recept smazán." });
  } catch (error) {
    console.error("❌ Chyba při mazání receptu:", error);
    res.status(500).json({ error: "Nepodařilo se smazat recept." });
  }
};

// ✅ Ingredience
export const getAllIngredients = async (_req: Request, res: Response): Promise<void> => {
  try {
    const ingredients = await getAllIngredientsFromDB();
    res.status(200).json(ingredients);
  } catch (error) {
    console.error("❌ Chyba při načítání surovin:", error);
    res.status(500).json({ error: "Chyba serveru při načítání surovin" });
  }
};

export const createIngredient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, calories_per_gram, category_id, default_grams, unit_name } = req.body;

    if (!name || !category_id || calories_per_gram === undefined) {
      res.status(400).json({ error: "Chybí povinné údaje pro surovinu." });
      return;
    }

    const created = await createIngredientInDB(
      name,
      Number(calories_per_gram),
      Number(category_id),
      default_grams ? Number(default_grams) : undefined,
      unit_name || undefined
    );
    res.status(201).json(created);
  } catch (error) {
    console.error("❌ Chyba při přidávání suroviny:", error);
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
    const { name, calories_per_gram, category_id, default_grams, unit_name } = req.body;

    if (!name || !category_id || calories_per_gram === undefined) {
      res.status(400).json({ error: "Chybí povinné údaje pro úpravu suroviny." });
      return;
    }

    const parsedDefaultGrams = default_grams === "" || default_grams === undefined ? null : Number(default_grams);

    const parsedUnitName = unit_name === "" || unit_name === undefined ? null : unit_name;

    await updateIngredientInDB(id, name, Number(calories_per_gram), Number(category_id), parsedDefaultGrams, parsedUnitName);
    res.status(200).json({ message: "Surovina upravena." });
  } catch (error) {
    console.error("❌ Chyba při úpravě suroviny:", error);
    res.status(500).json({ error: "Nepodařilo se upravit surovinu." });
  }
};

export const deleteIngredient = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Neplatné ID suroviny." });
    return;
  }

  try {
    await deleteIngredientFromDB(id);
    res.status(200).json({ message: "Surovina smazána." });
  } catch (error) {
    console.error("❌ Chyba při mazání suroviny:", error);
    res.status(500).json({ error: "Nepodařilo se smazat surovinu." });
  }
};
