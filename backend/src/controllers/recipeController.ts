// src/controllers/recipeController.ts
import { Request, Response } from "express";
import { getAllRecipes, getRecipeByIdFromDB, createFullRecipe, updateRecipeInDB, deleteRecipeFromDB, getAllIngredientsFromDB } from "../models/recipeModel";

// Převodní tabulka jednotek na gramy
const UNIT_CONVERSIONS: Record<string, number> = {
  lžíce: 10,
  lžička: 5,
  šálek: 240,
  hrnek: 240,
  ks: 50,
};

function normalizeIngredientUnit(ingredient: any): { amount: number; unit: string } {
  const rawAmount = ingredient.amount;
  const rawUnit = ingredient.unit?.trim().toLowerCase();

  if (rawUnit === "g" || !rawUnit) {
    return { amount: Number(rawAmount), unit: "g" };
  }

  const conversion = UNIT_CONVERSIONS[rawUnit];
  if (!conversion) {
    throw new Error(`Neznámá jednotka: ${rawUnit}`);
  }

  return { amount: Number(rawAmount) * conversion, unit: "g" };
}

export const addFullRecipe = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, notes, ingredients, categories, mealType, steps, calories } = req.body;

    if (!title || !ingredients || !categories || !mealType || !steps) {
      res.status(400).json({ error: "Chybí povinná pole." });
      return;
    }

    const parsedIngredients = JSON.parse(ingredients).map((ing: any) => {
      const { amount, unit } = normalizeIngredientUnit(ing);
      return {
        name: ing.name,
        amount,
        unit,
        calories_per_gram: Number(ing.calories_per_gram),
      };
    });

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
    const { title, notes, ingredients, categories, mealType, steps, calories, existingImageUrl } = req.body;

    if (!title || !ingredients || !categories || !mealType || !steps) {
      res.status(400).json({ error: "Chybí povinná pole." });
      return;
    }

    const parsedIngredients = JSON.parse(ingredients).map((ing: any) => {
      const { amount, unit } = normalizeIngredientUnit(ing);
      return {
        name: ing.name,
        amount,
        unit,
        calories_per_gram: Number(ing.calories_per_gram),
      };
    });

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
    res.status(500).json({
      error: "Nepodařilo se upravit recept.",
      detail: (error as Error).message,
    });
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

export const getAllIngredients = async (_req: Request, res: Response): Promise<void> => {
  try {
    const ingredients = await getAllIngredientsFromDB();
    res.status(200).json(ingredients);
  } catch (error) {
    console.error("❌ Chyba při načítání surovin:", error);
    res.status(500).json({ error: "Chyba serveru při načítání surovin" });
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
