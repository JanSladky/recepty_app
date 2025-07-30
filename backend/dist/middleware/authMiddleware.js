"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || "tajny_klic";
// Middleware pro ověření JWT tokenu a připojení user objektu k req
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];
        if (!token) {
            res.status(401).json({ message: "Chybí token." });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = {
            id: decoded.id,
            email: decoded.email,
            is_admin: decoded.is_admin,
        };
        next();
    }
    catch (error) {
        res.status(403).json({ message: "Neplatný nebo expirovaný token." });
    }
};
exports.authenticateToken = authenticateToken;
// Middleware pro ověření, že uživatel je admin
const requireAdmin = (req, res, next) => {
    if (!req.user?.is_admin) {
        res.status(403).json({ message: "Přístup odepřen. Vyžadována administrátorská práva." });
        return;
    }
    next();
};
exports.requireAdmin = requireAdmin;
