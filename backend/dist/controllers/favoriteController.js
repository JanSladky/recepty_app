"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFavorites = exports.addFavorite = void 0;
const db_1 = __importDefault(require("../utils/db"));
const addFavorite = async (req, res) => {
    const userId = req.body.userId; // později z tokenu
    const recipeId = req.body.recipeId;
    if (!userId || !recipeId) {
        return res.status(400).json({ error: "Chybí userId nebo recipeId." });
    }
    try {
        await db_1.default.query("INSERT INTO favorites (user_id, recipe_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [userId, recipeId]);
        return res.status(200).json({ message: "Recept přidán do oblíbených." });
    }
    catch (error) {
        console.error("Chyba při přidávání do oblíbených:", error);
        return res.status(500).json({ error: "Chyba serveru." });
    }
};
exports.addFavorite = addFavorite;
const getFavorites = async (req, res) => {
    const userId = req.params.userId;
    try {
        const result = await db_1.default.query("SELECT recipe_id FROM favorites WHERE user_id = $1", [userId]);
        return res.status(200).json(result.rows.map((r) => r.recipe_id));
    }
    catch (error) {
        console.error("Chyba při načítání oblíbených:", error);
        return res.status(500).json({ error: "Chyba serveru." });
    }
};
exports.getFavorites = getFavorites;
