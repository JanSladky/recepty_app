"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserByEmail = exports.loginUser = exports.registerUser = void 0;
const db_1 = __importDefault(require("../utils/db"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || "tajny_klic";
// ✅ Registrace nového uživatele
const registerUser = async (req, res) => {
    const { name, email, password } = req.body;
    if (!email || !password || !name) {
        return res.status(400).json({ error: "Všechna pole jsou povinná." });
    }
    try {
        const existing = await db_1.default.query("SELECT * FROM users WHERE email = $1", [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: "Uživatel s tímto e-mailem již existuje." });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const { rows } = await db_1.default.query("INSERT INTO users (name, email, password, is_admin) VALUES ($1, $2, $3, $4) RETURNING *", [name, email, hashedPassword, false]);
        const { password: _, ...userWithoutPassword } = rows[0];
        return res.status(201).json({ message: "Uživatel úspěšně registrován", user: userWithoutPassword });
    }
    catch (err) {
        console.error("❌ Chyba registrace:", err);
        return res.status(500).json({ error: "Chyba serveru" });
    }
};
exports.registerUser = registerUser;
// ✅ Přihlášení uživatele
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const { rows } = await db_1.default.query("SELECT * FROM users WHERE email = $1", [email]);
        const user = rows[0];
        if (!user) {
            return res.status(404).json({ error: "Uživatel nenalezen" });
        }
        const match = await bcryptjs_1.default.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: "Neplatné heslo" });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, is_admin: user.is_admin }, JWT_SECRET, { expiresIn: "7d" });
        const { password: _, ...userWithoutPassword } = user;
        res.json({ message: "Přihlášení úspěšné", token, user: userWithoutPassword });
    }
    catch (err) {
        console.error("❌ Chyba přihlášení:", err);
        res.status(500).json({ error: "Chyba serveru" });
    }
};
exports.loginUser = loginUser;
// ✅ Získání uživatele podle e-mailu (např. pro načtení profilu)
const getUserByEmail = async (req, res) => {
    const email = req.query.email;
    try {
        const { rows } = await db_1.default.query("SELECT * FROM users WHERE LOWER(email) = LOWER($1)", [email]);
        if (rows.length === 0) {
            return res.status(404).json({ error: "Uživatel nenalezen" });
        }
        const { password: _, ...userData } = rows[0]; // skryj heslo
        res.json(userData);
    }
    catch (err) {
        console.error("❌ Chyba při získávání uživatele:", err);
        res.status(500).json({ error: "Chyba serveru" });
    }
};
exports.getUserByEmail = getUserByEmail;
