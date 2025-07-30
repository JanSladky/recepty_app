"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserRole = exports.deleteUser = exports.getAllUsers = void 0;
const db_1 = __importDefault(require("../utils/db"));
// ✅ Seznam všech uživatelů
const getAllUsers = async (req, res) => {
    try {
        const result = await db_1.default.query("SELECT id, name, email, is_admin FROM users ORDER BY id");
        res.status(200).json(result.rows);
    }
    catch (error) {
        console.error("Chyba při načítání uživatelů:", error);
        res.status(500).json({ error: "Serverová chyba." });
    }
};
exports.getAllUsers = getAllUsers;
// ✅ Smazání uživatele
const deleteUser = async (req, res) => {
    const userId = parseInt(req.params.id);
    try {
        await db_1.default.query("DELETE FROM users WHERE id = $1", [userId]);
        res.status(200).json({ message: "Uživatel smazán." });
    }
    catch (error) {
        console.error("Chyba při mazání uživatele:", error);
        res.status(500).json({ error: "Serverová chyba." });
    }
};
exports.deleteUser = deleteUser;
// ✅ Změna role uživatele
const updateUserRole = async (req, res) => {
    const userId = parseInt(req.params.id);
    const { is_admin } = req.body;
    try {
        await db_1.default.query("UPDATE users SET is_admin = $1 WHERE id = $2", [is_admin, userId]);
        res.status(200).json({ message: "Role uživatele změněna." });
    }
    catch (error) {
        console.error("Chyba při změně role:", error);
        res.status(500).json({ error: "Serverová chyba." });
    }
};
exports.updateUserRole = updateUserRole;
