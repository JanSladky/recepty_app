"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserRole = exports.deleteUser = exports.getAllUsers = void 0;
const db_1 = __importDefault(require("../utils/db"));
/**
 * ✅ Seznam všech uživatelů
 * Přístup: pouze SUPERADMIN
 */
const getAllUsers = async (req, res) => {
    try {
        const result = await db_1.default.query("SELECT id, name, email, role FROM users ORDER BY id");
        res.status(200).json(result.rows);
    }
    catch (error) {
        console.error("Chyba při načítání uživatelů:", error);
        res.status(500).json({ error: "Serverová chyba." });
    }
};
exports.getAllUsers = getAllUsers;
/**
 * ✅ Smazání uživatele
 * Přístup: pouze SUPERADMIN
 */
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
/**
 * ✅ Změna role uživatele
 * Přístup: pouze SUPERADMIN
 */
const updateUserRole = async (req, res) => {
    const userId = parseInt(req.params.id);
    const { role } = req.body;
    // Validace role
    if (!role || !["SUPERADMIN", "ADMIN", "USER"].includes(role)) {
        res.status(400).json({ error: "Neplatná role. Povolené: SUPERADMIN, ADMIN, USER" });
        return;
    }
    try {
        // Ochrana – nelze odebrat roli poslednímu SUPERADMIN
        if (role !== "SUPERADMIN") {
            const countRes = await db_1.default.query("SELECT COUNT(*)::int AS count FROM users WHERE role = 'SUPERADMIN'");
            const superadmins = Number(countRes.rows[0].count);
            const target = await db_1.default.query("SELECT role FROM users WHERE id = $1", [userId]);
            const targetRole = target.rows[0]?.role;
            if (targetRole === "SUPERADMIN" && superadmins <= 1) {
                res.status(400).json({ error: "Nelze odebrat roli poslednímu SUPERADMINovi." });
                return;
            }
        }
        await db_1.default.query("UPDATE users SET role = $1 WHERE id = $2", [role, userId]);
        res.status(200).json({ message: "Role uživatele změněna." });
    }
    catch (error) {
        console.error("Chyba při změně role:", error);
        res.status(500).json({ error: "Serverová chyba." });
    }
};
exports.updateUserRole = updateUserRole;
