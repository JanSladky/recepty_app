"use strict";
// ✅ Umístění: backend/src/controllers/recipeController.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRecipe = exports.updateRecipe = exports.addFullRecipe = exports.getAllIngredients = exports.getRecipeById = exports.getRecipes = void 0;
const recipeModel_1 = require("../models/recipeModel");
// GET /api/recipes
const getRecipes = async (_req, res) => {
    try {
        const recipes = await (0, recipeModel_1.getAllRecipes)();
        res.status(200).json(recipes);
    }
    catch (error) {
        console.error("❌ Chyba při načítání receptů:", error);
        res.status(500).json({ error: "Chyba při načítání receptů" });
    }
};
exports.getRecipes = getRecipes;
// GET /api/recipes/:id
const getRecipeById = async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        res.status(400).json({ error: "Neplatné ID receptu." });
        return;
    }
    try {
        const recipe = await (0, recipeModel_1.getRecipeByIdFromDB)(id);
        if (!recipe) {
            res.status(404).json({ error: "Recept nenalezen." });
            return;
        }
        res.status(200).json(recipe);
    }
    catch (error) {
        console.error("❌ Chyba při načítání detailu receptu:", error);
        res.status(500).json({ error: "Chyba serveru při načítání receptu." });
    }
};
exports.getRecipeById = getRecipeById;
// GET /api/ingredients
const getAllIngredients = async (_req, res) => {
    try {
        const ingredients = await (0, recipeModel_1.getAllIngredientsFromDB)();
        res.status(200).json(ingredients);
    }
    catch (error) {
        console.error("❌ Chyba při načítání surovin:", error);
        res.status(500).json({ error: "Chyba serveru při načítání surovin" });
    }
};
exports.getAllIngredients = getAllIngredients;
// POST /api/recipes
const addFullRecipe = async (req, res) => {
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
            if (!ing.name ||
                typeof ing.amount !== "number" ||
                typeof ing.calories_per_gram !== "number" ||
                typeof ing.unit !== "string" ||
                ing.unit.trim().toLowerCase() !== "g") {
                res.status(400).json({ error: "Neplatná surovina. Pouze jednotka 'g' je povolena." });
                return;
            }
        }
        const imagePath = req.file?.secure_url ||
            req.file?.path ||
            "";
        const recipeId = await (0, recipeModel_1.createFullRecipe)(title, notes, imagePath, parsedMealTypes, parsedIngredients, parsedCategories, parsedSteps, parsedCalories);
        res.status(201).json({ message: "Recept uložen", id: recipeId });
    }
    catch (error) {
        console.error("❌ Chyba při ukládání receptu:", error);
        res.status(500).json({ error: "Nepodařilo se uložit recept." });
    }
};
exports.addFullRecipe = addFullRecipe;
// PUT /api/recipes/:id
const updateRecipe = async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        res.status(400).json({ error: "Neplatné ID" });
        return;
    }
    try {
        const { title, notes, ingredients, categories, mealType, steps, calories, existingImageUrl, } = req.body;
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
            if (!ing.name ||
                typeof ing.amount !== "number" ||
                typeof ing.calories_per_gram !== "number" ||
                typeof ing.unit !== "string" ||
                ing.unit.trim().toLowerCase() !== "g") {
                res.status(400).json({ error: "Neplatná surovina. Pouze jednotka 'g' je povolena." });
                return;
            }
        }
        const uploadedImageUrl = req.file?.secure_url ||
            req.file?.path ||
            null;
        let finalImageUrl = uploadedImageUrl || existingImageUrl || null;
        if (typeof finalImageUrl === "string" && (finalImageUrl.trim() === "" || finalImageUrl === "null")) {
            finalImageUrl = null;
        }
        await (0, recipeModel_1.updateRecipeInDB)(id, title, notes, finalImageUrl, parsedMealTypes, parsedIngredients, parsedCategories, parsedSteps, parsedCalories);
        res.status(200).json({ message: "Recept upraven" });
    }
    catch (error) {
        console.error("❌ Chyba při úpravě receptu:", error);
        res.status(500).json({ error: "Nepodařilo se upravit recept." });
    }
};
exports.updateRecipe = updateRecipe;
// DELETE /api/recipes/:id
const deleteRecipe = async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        res.status(400).json({ error: "Neplatné ID" });
        return;
    }
    try {
        await (0, recipeModel_1.deleteRecipeFromDB)(id);
        res.status(200).json({ message: "Recept smazán." });
    }
    catch (error) {
        console.error("❌ Chyba při mazání receptu:", error);
        res.status(500).json({ error: "Nepodařilo se smazat recept." });
    }
};
exports.deleteRecipe = deleteRecipe;
