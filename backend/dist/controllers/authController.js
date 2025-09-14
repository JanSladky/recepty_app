"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserByEmail = exports.loginUser = exports.registerUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../utils/db"));
// 👇 email utils + šablony
const sendEmail_1 = require("../utils/sendEmail");
const welcomeEmail_1 = require("../templates/welcomeEmail");
const newUserNotification_1 = require("../templates/newUserNotification");
const JWT_SECRET = process.env.JWT_SECRET || "tajny_klic";
const APP_URL = process.env.APP_URL ?? "https://recepty-app.vercel.app";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@example.com";
/**
 * POST /api/auth/register
 * Vytvoří uživatele (role se bere z DB default = 'USER')
 */
const registerUser = async (req, res) => {
    try {
        const { name, email, password, avatar_url } = req.body;
        if (!name || !email || !password) {
            res.status(400).json({ error: "Jméno, e-mail i heslo jsou povinné." });
            return;
        }
        // unikátní email (case-insensitive)
        const exist = await db_1.default.query("SELECT 1 FROM users WHERE LOWER(email) = LOWER($1)", [email]);
        if (exist.rows.length > 0) {
            res.status(409).json({ error: "Uživatel s tímto e-mailem už existuje." });
            return;
        }
        const hash = await bcryptjs_1.default.hash(password, 10);
        // role neuvádíme → použije se DEFAULT 'USER'
        const insert = await db_1.default.query(`INSERT INTO users (name, email, password, avatar_url)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, avatar_url, role`, [name, email, hash, avatar_url ?? null]);
        const user = insert.rows[0];
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
        // ✉️ Odeslat e-maily (neblokující)
        try {
            await Promise.allSettled([
                (0, sendEmail_1.sendEmail)(user.email, "Vítej v Recepty 🎉", (0, welcomeEmail_1.welcomeEmail)(user.name ?? "")),
                (0, sendEmail_1.sendEmail)(ADMIN_EMAIL, "Nový uživatel na Recepty", (0, newUserNotification_1.newUserNotification)(user.name ?? "—", user.email)),
            ]);
        }
        catch (e) {
            console.warn("⚠️ Problém při odeslání e-mailů po registraci:", e);
        }
        res.status(201).json({ message: "Registrace úspěšná.", token, user });
    }
    catch (error) {
        console.error("❌ Chyba registrace:", error);
        res.status(500).json({ error: "Serverová chyba při registraci." });
    }
};
exports.registerUser = registerUser;
/**
 * POST /api/auth/login
 * Přihlášení – vrací token s { id, email, role } a uživatele bez hesla
 */
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: "E-mail i heslo jsou povinné." });
            return;
        }
        const result = await db_1.default.query("SELECT id, name, email, password, avatar_url, role FROM users WHERE LOWER(email) = LOWER($1)", [email]);
        const user = result.rows[0];
        if (!user) {
            res.status(404).json({ error: "Uživatel nenalezen." });
            return;
        }
        const ok = await bcryptjs_1.default.compare(password, user.password);
        if (!ok) {
            res.status(401).json({ error: "Neplatné heslo." });
            return;
        }
        const { password: _omit, ...safeUser } = user;
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
        res.status(200).json({ message: "Přihlášení úspěšné.", token, user: safeUser });
    }
    catch (error) {
        console.error("❌ Chyba přihlášení:", error);
        res.status(500).json({ error: "Serverová chyba při přihlášení." });
    }
};
exports.loginUser = loginUser;
/**
 * GET /api/auth/me (nebo /api/user/email?email=...)
 * Vrátí info o uživateli – doporučené je /me s JWT
 */
const getUserByEmail = async (req, res) => {
    try {
        const email = req.query.email;
        if (!email) {
            res.status(400).json({ error: "Chybí parametr 'email'." });
            return;
        }
        const result = await db_1.default.query("SELECT id, name, email, role, avatar_url FROM users WHERE LOWER(email) = LOWER($1)", [email]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: "Uživatel nenalezen." });
            return;
        }
        res.status(200).json(result.rows[0]);
    }
    catch (error) {
        console.error("❌ Chyba při získání uživatele podle e-mailu:", error);
        res.status(500).json({ error: "Serverová chyba." });
    }
};
exports.getUserByEmail = getUserByEmail;
