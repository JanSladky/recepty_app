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
        res.status(400).json({ error: "Všechna pole jsou povinná." });
        return;
    }
    try {
        const existing = await db_1.default.query("SELECT * FROM users WHERE email = $1", [email]);
        if (existing.rows.length > 0) {
            res.status(400).json({ error: "Uživatel s tímto e-mailem již existuje." });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const { rows } = await db_1.default.query(`INSERT INTO users (name, email, password, is_admin)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, is_admin`, [name, email, hashedPassword, false]);
        const user = rows[0];
        const token = jsonwebtoken_1.default.sign(user, JWT_SECRET, { expiresIn: "7d" });
        res.status(201).json({
            message: "Uživatel úspěšně registrován",
            token,
            user,
        });
    }
    catch (err) {
        console.error("❌ Chyba registrace:", err);
        res.status(500).json({ error: "Chyba serveru" });
    }
};
exports.registerUser = registerUser;
// ✅ Přihlášení uživatele
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).json({ error: "Email i heslo jsou povinné." });
        return;
    }
    try {
        const { rows } = await db_1.default.query("SELECT * FROM users WHERE email = $1", [email]);
        const user = rows[0];
        if (!user) {
            res.status(404).json({ error: "Uživatel nenalezen." });
            return;
        }
        const match = await bcryptjs_1.default.compare(password, user.password);
        if (!match) {
            res.status(401).json({ error: "Neplatné heslo." });
            return;
        }
        const { password: _, ...userWithoutPassword } = user;
        const token = jsonwebtoken_1.default.sign(userWithoutPassword, JWT_SECRET, { expiresIn: "7d" });
        res.status(200).json({
            message: "Přihlášení úspěšné",
            token,
            user: userWithoutPassword,
        });
    }
    catch (err) {
        console.error("❌ Chyba přihlášení:", err);
        res.status(500).json({ error: "Chyba serveru" });
    }
};
exports.loginUser = loginUser;
// ✅ Získání uživatele podle e-mailu (např. pro profil)
const getUserByEmail = async (req, res) => {
    const email = req.query.email;
    if (!email) {
        res.status(400).json({ error: "Email je povinný parametr." });
        return;
    }
    try {
        const { rows } = await db_1.default.query("SELECT id, name, email, is_admin FROM users WHERE LOWER(email) = LOWER($1)", [email]);
        if (rows.length === 0) {
            res.status(404).json({ error: "Uživatel nenalezen." });
            return;
        }
        res.json(rows[0]);
    }
    catch (err) {
        console.error("❌ Chyba při načítání uživatele:", err);
        res.status(500).json({ error: "Chyba serveru" });
    }
};
exports.getUserByEmail = getUserByEmail;
