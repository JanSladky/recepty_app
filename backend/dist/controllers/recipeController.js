"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getAllCategories = exports.deleteIngredient = exports.updateIngredient = exports.createIngredient = exports.getAllIngredients = exports.deleteRecipe = exports.updateRecipe = exports.addRecipe = exports.getRecipeById = exports.getRecipes = void 0;
const db_1 = __importDefault(require("../utils/db")); // Důležitý import pro ověření
const recipeModel_1 = require("../models/recipeModel");
// --- Pomocná funkce pro ověření admina ---
const checkAdminPermissions = async (email) => {
    if (!email)
        return false;
    try {
        const result = await db_1.default.query("SELECT is_admin FROM users WHERE email = $1", [email]);
        return result.rows.length > 0 && result.rows[0].is_admin === true;
    }
    catch {
        return false;
    }
};
// --- Pomocné funkce ---
function processIngredients(rawIngredients) {
    if (typeof rawIngredients === "string") {
        try {
            return JSON.parse(rawIngredients);
        }
        catch {
            throw new Error("Chybný formát ingrediencí (nevalidní JSON)");
        }
    }
    else if (Array.isArray(rawIngredients)) {
        return rawIngredients;
    }
    throw new Error("Ingredience nejsou ve správném formátu");
}
// --- CONTROLLERY PRO RECEPTY ---
const getRecipes = async (_req, res) => {
    try {
        const recipes = await (0, recipeModel_1.getAllRecipes)();
        res.status(200).json(recipes);
    }
    catch (error) {
        res.status(500).json({ error: "Chyba při načítání receptů" });
    }
};
exports.getRecipes = getRecipes;
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
        res.status(500).json({ error: "Chyba serveru při načítání receptu." });
    }
};
exports.getRecipeById = getRecipeById;
const addRecipe = async (req, res) => {
    try {
        // ZDE JE ZMĚNA: Ověření admina se provádí zde, až po načtení dat.
        const isAdmin = await checkAdminPermissions(req.body.userEmail);
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
        const parsedCategories = typeof categories === 'string' ? JSON.parse(categories) : categories;
        const parsedMealTypes = typeof mealTypes === 'string' ? JSON.parse(mealTypes) : mealTypes;
        const parsedSteps = Array.isArray(steps) ? steps : JSON.parse(steps || "[]");
        const fileMeta = req.file;
        const imagePath = fileMeta?.secure_url || fileMeta?.path || "";
        const recipeId = await (0, recipeModel_1.createFullRecipe)(title, notes, imagePath, parsedMealTypes, parsedIngredients, parsedCategories, parsedSteps);
        res.status(201).json({ message: "Recept uložen", id: recipeId });
    }
    catch (error) {
        res.status(500).json({ error: "Nepodařilo se uložit recept.", detail: error.message });
    }
};
exports.addRecipe = addRecipe;
const updateRecipe = async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        res.status(400).json({ error: "Neplatné ID receptu." });
        return;
    }
    try {
        // ZDE JE ZMĚNA: Ověření admina se provádí zde, až po načtení dat.
        const isAdmin = await checkAdminPermissions(req.body.userEmail);
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
        const parsedCategories = typeof categories === 'string' ? JSON.parse(categories) : categories;
        const parsedMealTypes = typeof mealTypes === 'string' ? JSON.parse(mealTypes) : mealTypes;
        const parsedSteps = Array.isArray(steps) ? steps : JSON.parse(steps || "[]");
        const fileMeta = req.file;
        let finalImageUrl = fileMeta?.secure_url || fileMeta?.path || existingImageUrl || null;
        await (0, recipeModel_1.updateRecipeInDB)(id, title, notes, finalImageUrl, parsedMealTypes, parsedIngredients, parsedCategories, parsedSteps);
        res.status(200).json({ message: "Recept úspěšně upraven." });
    }
    catch (error) {
        res.status(500).json({ error: "Nepodařilo se upravit recept.", detail: error.message });
    }
};
exports.updateRecipe = updateRecipe;
const deleteRecipe = async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        res.status(400).json({ error: "Neplatné ID." });
        return;
    }
    try {
        await (0, recipeModel_1.deleteRecipeFromDB)(id);
        res.status(200).json({ message: "Recept smazán." });
    }
    catch (error) {
        res.status(500).json({ error: "Nepodařilo se smazat recept." });
    }
};
exports.deleteRecipe = deleteRecipe;
// --- CONTROLLERY PRO SUROVINY (beze změny) ---
const getAllIngredients = async (_req, res) => {
    try {
        const ingredients = await (0, recipeModel_1.getAllIngredientsFromDB)();
        res.status(200).json(ingredients);
    }
    catch (error) {
        res.status(500).json({ error: "Chyba serveru při načítání surovin" });
    }
};
exports.getAllIngredients = getAllIngredients;
const createIngredient = async (req, res) => {
    try {
        const { name, category_id, calories_per_gram, default_grams, unit_name } = req.body;
        if (!name || category_id === undefined || calories_per_gram === undefined) {
            res.status(400).json({ error: "Chybí povinné údaje." });
            return;
        }
        const newIngredient = await (0, recipeModel_1.createIngredientInDB)(name.trim(), Number(calories_per_gram), Number(category_id), default_grams ? Number(default_grams) : undefined, unit_name || undefined);
        res.status(201).json(newIngredient);
    }
    catch (error) {
        res.status(500).json({ error: "Nepodařilo se přidat surovinu." });
    }
};
exports.createIngredient = createIngredient;
const updateIngredient = async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        res.status(400).json({ error: "Neplatné ID suroviny." });
        return;
    }
    try {
        const { name, category_id, calories_per_gram, default_grams, unit_name } = req.body;
        if (name === undefined || category_id === undefined || calories_per_gram === undefined) {
            res.status(400).json({ error: "Chybí povinné údaje." });
            return;
        }
        const parsedDefaultGrams = (default_grams === "" || default_grams === undefined) ? null : Number(default_grams);
        const parsedUnitName = (unit_name === "" || unit_name === undefined) ? null : unit_name;
        await (0, recipeModel_1.updateIngredientInDB)(id, name.trim(), Number(calories_per_gram), Number(category_id), parsedDefaultGrams, parsedUnitName);
        res.status(200).json({ message: "Surovina byla úspěšně aktualizována." });
    }
    catch (error) {
        res.status(500).json({ error: "Nepodařilo se upravit surovinu." });
    }
};
exports.updateIngredient = updateIngredient;
const deleteIngredient = async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        res.status(400).json({ error: "Neplatné ID." });
        return;
    }
    try {
        await (0, recipeModel_1.deleteIngredientFromDB)(id);
        res.status(200).json({ message: "Surovina smazána." });
    }
    catch (error) {
        res.status(500).json({ error: "Nepodařilo se smazat surovinu." });
    }
};
exports.deleteIngredient = deleteIngredient;
// --- CONTROLLERY PRO KATEGORIE (beze změny) ---
const getAllCategories = async (_req, res) => {
    try {
        const categories = await (0, recipeModel_1.getAllIngredientCategories)();
        res.status(200).json(categories);
    }
    catch (error) {
        res.status(500).json({ error: "Chyba při načítání kategorií." });
    }
};
exports.getAllCategories = getAllCategories;
const createCategory = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || typeof name !== 'string') {
            res.status(400).json({ error: "Název kategorie je povinný." });
            return;
        }
        const newCategory = await (0, recipeModel_1.createIngredientCategory)(name);
        res.status(201).json(newCategory);
    }
    catch (error) {
        res.status(500).json({ error: "Nepodařilo se vytvořit kategorii." });
    }
};
exports.createCategory = createCategory;
const updateCategory = async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        res.status(400).json({ error: "Neplatné ID." });
        return;
    }
    try {
        const { name } = req.body;
        if (!name || typeof name !== 'string') {
            res.status(400).json({ error: "Název kategorie je povinný." });
            return;
        }
        await (0, recipeModel_1.updateIngredientCategory)(id, name);
        res.status(200).json({ message: "Kategorie upravena." });
    }
    catch (error) {
        res.status(500).json({ error: "Nepodařilo se upravit kategorii." });
    }
};
exports.updateCategory = updateCategory;
const deleteCategory = async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        res.status(400).json({ error: "Neplatné ID." });
        return;
    }
    try {
        await (0, recipeModel_1.deleteIngredientCategory)(id);
        res.status(200).json({ message: "Kategorie smazána." });
    }
    catch (error) {
        res.status(500).json({ error: "Nepodařilo se smazat kategorii." });
    }
};
exports.deleteCategory = deleteCategory;
