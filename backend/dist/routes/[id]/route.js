"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateIngredient = updateIngredient;
exports.deleteIngredient = deleteIngredient;
const db_1 = __importDefault(require("../../utils/db"));
async function updateIngredient(req, res) {
    const id = Number(req.params.id);
    if (isNaN(id))
        return res.status(400).json({ error: "Neplatné ID." });
    const { name, category, calories_per_gram } = req.body;
    if (!name || typeof calories_per_gram !== "number") {
        return res.status(400).json({ error: "Neplatná data." });
    }
    try {
        await db_1.default.query("UPDATE ingredients SET name = $1, category = $2, calories_per_gram = $3 WHERE id = $4", [name, category, calories_per_gram, id]);
        res.json({ success: true });
    }
    catch (err) {
        console.error("❌ Chyba při aktualizaci suroviny:", err);
        res.status(500).json({ error: "Server error" });
    }
}
async function deleteIngredient(req, res) {
    const id = Number(req.params.id);
    if (isNaN(id))
        return res.status(400).json({ error: "Neplatné ID." });
    try {
        await db_1.default.query("DELETE FROM ingredients WHERE id = $1", [id]);
        res.json({ success: true });
    }
    catch (err) {
        console.error("❌ Chyba při mazání suroviny:", err);
        res.status(500).json({ error: "Server error" });
    }
}
