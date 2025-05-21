"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRecipe = exports.updateRecipe = exports.addFullRecipe = exports.getRecipeById = exports.getRecipes = void 0;
const recipeModel_1 = require("../models/recipeModel");
// ✅ GET /api/recipes
const getRecipes = async (req, res) => {
    try {
        const recipes = await (0, recipeModel_1.getAllRecipes)();
        res.json(recipes);
    }
    catch (error) {
        console.error("❌ Chyba při načítání receptů:", error);
        res.status(500).json({ error: "Chyba při načítání receptů" });
    }
};
exports.getRecipes = getRecipes;
// ✅ GET /api/recipes/:id
const getRecipeById = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const recipe = await (0, recipeModel_1.getRecipeByIdFromDB)(id);
        console.log("📦 Odpověď z DB:", recipe);
        if (!recipe) {
            res.status(404).json({ error: "Recept nenalezen" });
            return;
        }
        res.json(recipe);
    }
    catch (error) {
        console.error("❌ Chyba při načítání detailu receptu:", error);
        res.status(500).json({ error: "Chyba serveru" });
    }
};
exports.getRecipeById = getRecipeById;
// ✅ POST /api/recipes
const addFullRecipe = async (req, res) => {
    try {
        const { title, description, ingredients, categories, mealType, steps } = req.body;
        if (!title || !description || !ingredients || !categories || !mealType || !steps) {
            res.status(400).json({ error: "Chybí povinná pole." });
            return;
        }
        const parsedIngredients = JSON.parse(ingredients);
        const parsedCategories = JSON.parse(categories);
        const parsedMealTypes = JSON.parse(mealType);
        const parsedSteps = Array.isArray(steps) ? steps : JSON.parse(steps || "[]");
        const imagePath = req.file?.secure_url || req.file?.path || "";
        const recipeId = await (0, recipeModel_1.createFullRecipe)(title, description, imagePath, parsedMealTypes, parsedIngredients, parsedCategories, parsedSteps);
        res.status(201).json({ message: "Recept uložen", id: recipeId });
    }
    catch (error) {
        console.error("❌ Chyba při ukládání receptu:", error);
        res.status(500).json({ error: "Nepodařilo se uložit recept." });
    }
};
exports.addFullRecipe = addFullRecipe;
// ✅ PUT /api/recipes/:id
const updateRecipe = async (req, res) => {
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
        const parsedSteps = Array.isArray(steps) ? steps : JSON.parse(steps || "[]");
        const uploadedImageUrl = req.file?.secure_url || req.file?.path || null;
        let finalImageUrl = uploadedImageUrl || existingImageUrl || null;
        if (uploadedImageUrl && uploadedImageUrl.trim() !== "") {
            finalImageUrl = uploadedImageUrl;
        }
        else if (typeof existingImageUrl === "string" && existingImageUrl.trim() !== "" && existingImageUrl !== "null") {
            finalImageUrl = existingImageUrl;
        }
        console.log("🔄 Aktualizace receptu:");
        console.log("• title:", title);
        console.log("• uploadedImageUrl:", uploadedImageUrl);
        console.log("• existingImageUrl:", existingImageUrl);
        console.log("✅ Použito finalImageUrl:", finalImageUrl);
        await (0, recipeModel_1.updateRecipeInDB)(id, title, description, finalImageUrl, parsedMealTypes, parsedIngredients, parsedCategories, parsedSteps);
        res.status(200).json({ message: "Recept upraven" });
    }
    catch (error) {
        console.error("❌ Chyba při úpravě receptu:", error);
        res.status(500).json({ error: "Nepodařilo se upravit recept." });
    }
};
exports.updateRecipe = updateRecipe;
// ✅ DELETE /api/recipes/:id
const deleteRecipe = async (req, res) => {
    try {
        const id = Number(req.params.id);
        await (0, recipeModel_1.deleteRecipeFromDB)(id);
        res.status(200).json({ message: "Recept smazán." });
    }
    catch (error) {
        console.error("❌ Chyba při mazání receptu:", error);
        res.status(500).json({ error: "Nepodařilo se smazat recept." });
    }
};
exports.deleteRecipe = deleteRecipe;
