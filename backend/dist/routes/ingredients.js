"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/ingredientRoutes.ts
const express_1 = __importDefault(require("express"));
const recipeModel_1 = require("../models/recipeModel");
const db_1 = __importDefault(require("../utils/db"));
const router = express_1.default.Router();
// ✅ Získání všech surovin
router.get("/", async (req, res) => {
    try {
        const ingredients = await (0, recipeModel_1.getAllIngredientsFromDB)();
        res.json(ingredients);
    }
    catch (err) {
        console.error("❌ Chyba při načítání surovin:", err);
        res.status(500).json({ error: "Chyba serveru při načítání surovin" });
    }
});
// ✅ Vytvoření nové suroviny
router.post("/", async (req, res) => {
    const { name, category_id, calories_per_gram, default_grams, unit_name } = req.body;
    if (typeof name !== "string" || typeof category_id !== "number" || typeof calories_per_gram !== "number") {
        res.status(400).json({ error: "Neplatný vstup." });
        return;
    }
    try {
        const result = await db_1.default.query("SELECT id FROM ingredient_categories WHERE id = $1", [category_id]);
        if (result.rows.length === 0) {
            res.status(400).json({ error: "Zvolená kategorie neexistuje." });
            return;
        }
        const newIngredient = await (0, recipeModel_1.createIngredientInDB)(name.trim(), calories_per_gram, category_id, typeof default_grams === "number" ? default_grams : undefined, typeof unit_name === "string" ? unit_name.trim() : undefined);
        res.status(201).json(newIngredient);
    }
    catch (err) {
        console.error("❌ Chyba při vytváření suroviny:", err);
        res.status(500).json({ error: "Chyba serveru při vytváření suroviny" });
    }
});
// ✅ Úprava existující suroviny
router.put("/:id", async (req, res) => {
    const id = Number(req.params.id);
    const { name, category_id, calories_per_gram, default_grams, unit_name } = req.body;
    if (isNaN(id) || typeof name !== "string" || typeof category_id !== "number" || typeof calories_per_gram !== "number") {
        res.status(400).json({ error: "Neplatný vstup." });
        return;
    }
    try {
        const categoryCheck = await db_1.default.query("SELECT id FROM ingredient_categories WHERE id = $1", [category_id]);
        if (categoryCheck.rows.length === 0) {
            res.status(400).json({ error: `Kategorie s ID '${category_id}' neexistuje.` });
            return;
        }
        await (0, recipeModel_1.updateIngredientInDB)(id, name.trim(), calories_per_gram, category_id, typeof default_grams === "number" ? default_grams : null, typeof unit_name === "string" ? unit_name.trim() : null);
        res.status(200).json({ message: "✅ Surovina byla úspěšně aktualizována." });
    }
    catch (err) {
        console.error("❌ Chyba při aktualizaci suroviny:", err);
        res.status(500).json({ error: "Chyba serveru při aktualizaci suroviny" });
    }
});
// ✅ Smazání suroviny
router.delete("/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        res.status(400).json({ error: "Neplatné ID." });
        return;
    }
    try {
        await (0, recipeModel_1.deleteIngredientFromDB)(id);
        res.status(200).json({ message: "✅ Surovina byla úspěšně smazána." });
    }
    catch (err) {
        console.error("❌ Chyba při mazání suroviny:", err);
        res.status(500).json({ error: "Chyba serveru při mazání suroviny" });
    }
});
// ✅ Získání všech kategorií surovin
router.get("/categories", async (req, res) => {
    try {
        const categories = await (0, recipeModel_1.getAllIngredientCategories)();
        res.json(categories);
    }
    catch (err) {
        console.error("❌ Chyba při načítání kategorií:", err);
        res.status(500).json({ error: "Chyba serveru při načítání kategorií" });
    }
});
// ✅ Vytvoření nové kategorie
router.post("/categories", async (req, res) => {
    const { name } = req.body;
    if (typeof name !== "string") {
        res.status(400).json({ error: "Neplatný název kategorie." });
        return;
    }
    try {
        const category = await (0, recipeModel_1.createIngredientCategory)(name.trim());
        res.status(201).json(category);
    }
    catch (err) {
        console.error("❌ Chyba při vytváření kategorie:", err);
        res.status(500).json({ error: "Chyba serveru při vytváření kategorie" });
    }
});
// ✅ Úprava kategorie
router.put("/categories/:id", async (req, res) => {
    const id = Number(req.params.id);
    const { name } = req.body;
    if (isNaN(id) || typeof name !== "string") {
        res.status(400).json({ error: "Neplatný vstup." });
        return;
    }
    try {
        await (0, recipeModel_1.updateIngredientCategory)(id, name.trim());
        res.status(200).json({ message: "✅ Kategorie byla aktualizována." });
    }
    catch (err) {
        console.error("❌ Chyba při úpravě kategorie:", err);
        res.status(500).json({ error: "Chyba serveru při úpravě kategorie" });
    }
});
// ✅ Smazání kategorie
router.delete("/categories/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        res.status(400).json({ error: "Neplatné ID kategorie." });
        return;
    }
    try {
        await (0, recipeModel_1.deleteIngredientCategory)(id);
        res.status(200).json({ message: "✅ Kategorie byla smazána." });
    }
    catch (err) {
        console.error("❌ Chyba při mazání kategorie:", err);
        res.status(500).json({ error: "Chyba serveru při mazání kategorie" });
    }
});
exports.default = router;
