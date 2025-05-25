// ✅ Umístění: backend/src/controllers/recipeController.ts

import { Request, Response } from "express";
import {
  getAllRecipes,
  getRecipeByIdFromDB,
  createFullRecipe,
  updateRecipeInDB,
  deleteRecipeFromDB,
  getAllIngredientsFromDB,
} from "../models/recipeModel";

// GET /api/recipes
export const getRecipes = async (_req: Request, res: Response): Promise<void> => {
  try {
    const recipes = await getAllRecipes();
    res.status(200).json(recipes);
  } catch (error) {
    console.error("❌ Chyba při načítání receptů:", error);
    res.status(500).json({ error: "Chyba při načítání receptů" });
  }
};

// GET /api/recipes/:id
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

// GET /api/ingredients
export const getAllIngredients = async (_req: Request, res: Response): Promise<void> => {
  try {
    const ingredients = await getAllIngredientsFromDB();
    res.status(200).json(ingredients);
  } catch (error) {
    console.error("❌ Chyba při načítání surovin:", error);
    res.status(500).json({ error: "Chyba serveru při načítání surovin" });
  }
};

// POST /api/recipes
export const addFullRecipe = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, notes, ingredients, categories, mealType, steps, calories } = req.body;

    if (!title || !ingredients || !categories || !mealType || !steps) {
      res.status(400).json({ error: "Chybí povinná pole." });
      return;
    }

    const parsedIngredients = JSON.parse(ingredients);
    const parsedCategories = JSON.parse(categories);
    const parsedMealTypes = JSON.parse(mealType);
    const parsedSteps = Array.isArray(steps) ? steps : JSON.parse(steps || "[]");
    const parsedCalories = calories ? Number(calories) : null;

    // ✅ Vynucení jednotky "g"
    for (const ing of parsedIngredients) {
      ing.unit = "g";
    }

    for (const ing of parsedIngredients) {
      if (
        !ing.name ||
        typeof ing.amount !== "number" ||
        typeof ing.calories_per_gram !== "number" ||
        typeof ing.unit !== "string" ||
        ing.unit.trim().toLowerCase() !== "g"
      ) {
        res.status(400).json({ error: "Neplatná surovina. Pouze jednotka 'g' je povolena." });
        return;
      }
    }

    const imagePath =
      (req.file as { secure_url?: string; path?: string })?.secure_url ||
      req.file?.path ||
      "";

    const recipeId = await createFullRecipe(
      title,
      notes,
      imagePath,
      parsedMealTypes,
      parsedIngredients,
      parsedCategories,
      parsedSteps,
      parsedCalories
    );

    res.status(201).json({ message: "Recept uložen", id: recipeId });
  } catch (error) {
    console.error("❌ Chyba při ukládání receptu:", error);
    res.status(500).json({ error: "Nepodařilo se uložit recept." });
  }
};

// PUT /api/recipes/:id
export const updateRecipe = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Neplatné ID" });
    return;
  }

  try {
    const {
      title,
      notes,
      ingredients,
      categories,
      mealType,
      steps,
      calories,
      existingImageUrl,
    } = req.body;

    if (!title || !ingredients || !categories || !mealType || !steps) {
      res.status(400).json({ error: "Chybí povinná pole." });
      return;
    }

    const parsedIngredients = JSON.parse(ingredients);
    const parsedCategories = JSON.parse(categories);
    const parsedMealTypes = JSON.parse(mealType);
    const parsedSteps = Array.isArray(steps) ? steps : JSON.parse(steps || "[]");
    const parsedCalories = calories ? Number(calories) : null;

    // ✅ Vynucení jednotky "g"
    for (const ing of parsedIngredients) {
      ing.unit = "g";
    }

    for (const ing of parsedIngredients) {
      if (
        !ing.name ||
        typeof ing.amount !== "number" ||
        typeof ing.calories_per_gram !== "number" ||
        typeof ing.unit !== "string" ||
        ing.unit.trim().toLowerCase() !== "g"
      ) {
        res.status(400).json({ error: "Neplatná surovina. Pouze jednotka 'g' je povolena." });
        return;
      }
    }

    const uploadedImageUrl =
      (req.file as { secure_url?: string; path?: string })?.secure_url ||
      req.file?.path ||
      null;

    let finalImageUrl: string | null = uploadedImageUrl || existingImageUrl || null;

    if (typeof finalImageUrl === "string" && (finalImageUrl.trim() === "" || finalImageUrl === "null")) {
      finalImageUrl = null;
    }

    await updateRecipeInDB(
      id,
      title,
      notes,
      finalImageUrl,
      parsedMealTypes,
      parsedIngredients,
      parsedCategories,
      parsedSteps,
      parsedCalories
    );

    res.status(200).json({ message: "Recept upraven" });
  } catch (error) {
    console.error("❌ Chyba při úpravě receptu:", error);
    res.status(500).json({ error: "Nepodařilo se upravit recept." });
  }
};

// DELETE /api/recipes/:id
export const deleteRecipe = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Neplatné ID" });
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