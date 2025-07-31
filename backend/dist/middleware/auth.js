"use strict";
// 📁 backend/src/middleware/auth.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyUser = exports.verifyAdmin = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || "tajny_klic";
// ✅ Middleware: Ověření tokenu a připojení uživatele k req
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];
        console.log("🛡️ Authorization header:", authHeader);
        console.log("🛡️ Token:", token);
        if (!token) {
            console.warn("❌ Chybí token!");
            res.status(401).json({ message: "Chybí token." });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        console.log("✅ JWT decoded:", decoded);
        // ✅ Uložení uživatele do requestu
        req.user = decoded;
        next();
    }
    catch (error) {
        console.error("❌ Neplatný token:", error);
        res.status(403).json({ message: "Neplatný nebo expirovaný token." });
    }
};
exports.authenticateToken = authenticateToken;
// ✅ Middleware: Ověření admin práv
const verifyAdmin = (req, res, next) => {
    console.log("🔐 verifyAdmin - req.user:", req.user);
    if (!req.user?.is_admin) {
        console.warn("⛔ Přístup zamítnut. Není administrátor:", req.user);
        res.status(403).json({ message: "Přístup pouze pro administrátory." });
        return;
    }
    next();
};
exports.verifyAdmin = verifyAdmin;
exports.verifyUser = exports.authenticateToken;
