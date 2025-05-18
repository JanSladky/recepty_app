import { Request, Response } from "express";
import { getAllRecipes, getRecipeByIdFromDB, createFullRecipe, deleteRecipeFromDB, updateRecipeInDB } from "../models/recipeModel";

export const getRecipes = async (req: Request, res: Response) => {
  try {
    const recipes = await getAllRecipes();
    res.json(recipes);
  } catch (error) {
    console.error("Chyba při načítání receptů:", error);
    res.status(500).json({ error: "Chyba při načítání receptů" });
  }
};

export const getRecipeById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const recipe = await getRecipeByIdFromDB(id);
    if (!recipe) {
      res.status(404).json({ error: "Recept nenalezen" });
      return;
    }
    res.json(recipe);
  } catch (error) {
    console.error("Chyba při načítání detailu receptu:", error);
    res.status(500).json({ error: "Chyba serveru" });
  }
};

export const addFullRecipe = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("📦 Request body:", req.body);
    console.log("📷 Request file:", req.file);

    const { title, description, ingredients, categories, mealType } = req.body;

    if (!title || !description || !ingredients || !categories || !mealType) {
      res.status(400).json({ error: "Chybí povinná pole." });
      return;
    }

    const parsedIngredients = JSON.parse(ingredients);
    const parsedCategories = JSON.parse(categories);
    const parsedMealTypes = JSON.parse(mealType);

    const file = req.file as any; // 👈 přetypování, aby TS nehlásil chybu
    const imagePath = file?.url || file?.path || "";

    const recipeId = await createFullRecipe(title, description, imagePath, parsedMealTypes, parsedIngredients, parsedCategories);

    res.status(201).json({ message: "Recept uložen", id: recipeId });
  } catch (error) {
    console.error("Chyba při ukládání receptu:", error);
    res.status(500).json({ error: "Nepodařilo se uložit recept." });
  }
};

export const updateRecipe = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { title, description, ingredients, categories, mealType } = req.body;

    if (!title || !description || !ingredients || !categories || !mealType) {
      res.status(400).json({ error: "Chybí povinná pole." });
      return;
    }

    const parsedIngredients = JSON.parse(ingredients);
    const parsedCategories = JSON.parse(categories);
    const parsedMealTypes = JSON.parse(mealType);
    const imagePath = req.file?.path || null; // ✅ Cloudinary URL nebo null (beze změny)

    await updateRecipeInDB(id, title, description, imagePath, parsedMealTypes, parsedIngredients, parsedCategories);

    res.status(200).json({ message: "Recept upraven" });
  } catch (error) {
    console.error("Chyba při úpravě receptu:", error);
    res.status(500).json({ error: "Nepodařilo se upravit recept." });
  }
};

export const deleteRecipe = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    await deleteRecipeFromDB(id);
    res.status(200).json({ message: "Recept smazán." });
  } catch (error) {
    console.error("Chyba při mazání receptu:", error);
    res.status(500).json({ error: "Nepodařilo se smazat recept." });
  }
};
