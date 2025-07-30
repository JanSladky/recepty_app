"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateShoppingList = exports.toggleFavorite = exports.getMyFavorites = exports.resetPassword = exports.loginUser = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../utils/db"));
const JWT_SECRET = process.env.JWT_SECRET || "tajny_klic";
// ✅ Přihlášení uživatele
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await db_1.default.query("SELECT * FROM users WHERE email = $1", [email]);
        const user = result.rows[0];
        if (!user) {
            res.status(401).json({ message: "Neplatné přihlašovací údaje." });
            return;
        }
        const isMatch = await bcrypt_1.default.compare(password, user.password);
        if (!isMatch) {
            res.status(401).json({ message: "Neplatné přihlašovací údaje." });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, is_admin: user.is_admin }, JWT_SECRET, { expiresIn: "1d" });
        res.status(200).json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                is_admin: user.is_admin,
            },
        });
    }
    catch (error) {
        console.error("Chyba při přihlášení:", error);
        res.status(500).json({ error: "Chyba serveru při přihlášení." });
    }
};
exports.loginUser = loginUser;
// ✅ Reset hesla pro uživatele podle e-mailu
const resetPassword = async (req, res) => {
    const { email, newPassword } = req.body;
    try {
        const salt = await bcrypt_1.default.genSalt(10);
        const hashed = await bcrypt_1.default.hash(newPassword, salt);
        const result = await db_1.default.query("UPDATE users SET password = $1 WHERE email = $2", [hashed, email]);
        if (result.rowCount === 0) {
            res.status(404).json({ message: "Uživatel s tímto e-mailem neexistuje." });
            return;
        }
        res.status(200).json({ message: "Heslo bylo úspěšně změněno." });
    }
    catch (error) {
        console.error("Chyba při resetování hesla:", error);
        res.status(500).json({ error: "Chyba serveru při resetu hesla." });
    }
};
exports.resetPassword = resetPassword;
// ✅ Získání oblíbených receptů přihlášeného uživatele
const getMyFavorites = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: "Neautorizovaný přístup." });
            return;
        }
        const result = await db_1.default.query(`SELECT r.* FROM recipes r
       JOIN favorites f ON r.id = f.recipe_id
       WHERE f.user_id = $1`, [userId]);
        res.status(200).json(result.rows);
    }
    catch (error) {
        console.error("Chyba při načítání oblíbených receptů:", error);
        res.status(500).json({ error: "Chyba serveru." });
    }
};
exports.getMyFavorites = getMyFavorites;
// ✅ Přidání nebo odebrání receptu z oblíbených
const toggleFavorite = async (req, res) => {
    try {
        const userId = req.user?.id;
        const recipeId = parseInt(req.params.id);
        console.log("🔁 toggleFavorite");
        console.log("➡️ userId:", userId);
        console.log("➡️ recipeId:", recipeId);
        if (!userId || isNaN(recipeId)) {
            console.log("❌ Neplatné ID!");
            res.status(400).json({ message: "Neplatné ID uživatele nebo receptu." });
            return;
        }
        const existing = await db_1.default.query("SELECT * FROM favorites WHERE user_id = $1 AND recipe_id = $2", [userId, recipeId]);
        console.log("📦 existující záznam:", existing.rows);
        if (existing.rows.length > 0) {
            await db_1.default.query("DELETE FROM favorites WHERE user_id = $1 AND recipe_id = $2", [userId, recipeId]);
            console.log("🗑️ Recept odebrán z oblíbených");
            res.status(200).json({ message: "Recept odebrán z oblíbených." });
        }
        else {
            await db_1.default.query("INSERT INTO favorites (user_id, recipe_id) VALUES ($1, $2)", [userId, recipeId]);
            console.log("⭐ Recept přidán do oblíbených");
            res.status(200).json({ message: "Recept přidán do oblíbených." });
        }
    }
    catch (error) {
        console.error("❌ Chyba při úpravě oblíbených:", error);
        res.status(500).json({ error: "Chyba serveru." });
    }
};
exports.toggleFavorite = toggleFavorite;
// ✅ Generování nákupního seznamu z oblíbených receptů
const generateShoppingList = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: "Neautorizovaný přístup." });
            return;
        }
        const result = await db_1.default.query(`SELECT i.name, ri.quantity, ri.unit
       FROM recipes r
       JOIN favorites f ON f.recipe_id = r.id
       JOIN recipe_ingredients ri ON ri.recipe_id = r.id
       JOIN ingredients i ON i.id = ri.ingredient_id
       WHERE f.user_id = $1`, [userId]);
        res.status(200).json(result.rows);
    }
    catch (error) {
        console.error("Chyba při generování nákupního seznamu:", error);
        res.status(500).json({ error: "Chyba serveru." });
    }
};
exports.generateShoppingList = generateShoppingList;
