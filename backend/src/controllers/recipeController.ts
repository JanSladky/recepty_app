import { Request, Response } from "express";
import { getAllRecipes, getRecipeByIdFromDB, createFullRecipe, deleteRecipeFromDB, updateRecipeInDB } from "../models/recipeModel";

// ✅ GET /api/recipes
export const getRecipes = async (req: Request, res: Response): Promise<void> => {
  try {
    const recipes = await getAllRecipes();
    res.json(recipes);
  } catch (error) {
    console.error("❌ Chyba při načítání receptů:", error);
    res.status(500).json({ error: "Chyba při načítání receptů" });
  }
};

// ✅ GET /api/recipes/:id
export const getRecipeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const recipe = await getRecipeByIdFromDB(id);
    if (!recipe) {
      res.status(404).json({ error: "Recept nenalezen" });
      return;
    }
    res.json(recipe);
  } catch (error) {
    console.error("❌ Chyba při načítání detailu receptu:", error);
    res.status(500).json({ error: "Chyba serveru" });
  }
};

// ✅ POST /api/recipes
export const addFullRecipe = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, ingredients, categories, mealType, steps } = req.body;

    if (!title || !description || !ingredients || !categories || !mealType || !steps) {
      res.status(400).json({ error: "Chybí povinná pole." });
      return;
    }

    const parsedIngredients = JSON.parse(ingredients);
    const parsedCategories = JSON.parse(categories);
    const parsedMealTypes = JSON.parse(mealType);
    const parsedSteps = steps ? JSON.parse(steps) : [];

    const imagePath = (req.file as { secure_url?: string; path?: string })?.secure_url || req.file?.path || "";

    const recipeId = await createFullRecipe(title, description, imagePath, parsedMealTypes, parsedIngredients, parsedCategories, parsedSteps);

    res.status(201).json({ message: "Recept uložen", id: recipeId });
  } catch (error) {
    console.error("❌ Chyba při ukládání receptu:", error);
    res.status(500).json({ error: "Nepodařilo se uložit recept." });
  }
};

// ✅ PUT /api/recipes/:id
export const updateRecipe = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { title, description, ingredients, categories, mealType, existingImageUrl, steps } = req.body;

    if (!title || !description || !ingredients || !categories || !mealType) {
      res.status(400).json({ error: "Chybí povinná pole." });
      return;
    }

    const parsedIngredients = JSON.parse(ingredients);
    const parsedCategories = JSON.parse(categories);
    const parsedMealTypes = JSON.parse(mealType);
    const parsedSteps = steps ? JSON.parse(steps) : [];

    const uploadedImageUrl = (req.file as { secure_url?: string; path?: string })?.secure_url || req.file?.path || null;

    let finalImageUrl: string | null = uploadedImageUrl || existingImageUrl || null;

    if (uploadedImageUrl && uploadedImageUrl.trim() !== "") {
      finalImageUrl = uploadedImageUrl;
    } else if (typeof existingImageUrl === "string" && existingImageUrl.trim() !== "" && existingImageUrl !== "null") {
      finalImageUrl = existingImageUrl;
    }

    console.log("🔄 Aktualizace receptu:");
    console.log("• title:", title);
    console.log("• uploadedImageUrl:", uploadedImageUrl);
    console.log("• existingImageUrl:", existingImageUrl);
    console.log("✅ Použito finalImageUrl:", finalImageUrl);

    await updateRecipeInDB(id, title, description, finalImageUrl, parsedMealTypes, parsedIngredients, parsedCategories, parsedSteps);

    res.status(200).json({ message: "Recept upraven" });
  } catch (error) {
    console.error("❌ Chyba při úpravě receptu:", error);
    res.status(500).json({ error: "Nepodařilo se upravit recept." });
  }
};

// ✅ DELETE /api/recipes/:id
export const deleteRecipe = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    await deleteRecipeFromDB(id);
    res.status(200).json({ message: "Recept smazán." });
  } catch (error) {
    console.error("❌ Chyba při mazání receptu:", error);
    res.status(500).json({ error: "Nepodařilo se smazat recept." });
  }
};
