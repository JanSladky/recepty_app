"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySuperadmin = exports.verifyAdmin = exports.verifyUser = exports.requireRole = exports.authenticateTokenOptional = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || "tajny_klic";
// ✅ Ověření JWT
const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader?.split(" ")[1];
        if (!token) {
            res.status(401).json({ message: "Chybí token." });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch {
        res.status(403).json({ message: "Neplatný nebo expirovaný token." });
    }
};
exports.authenticateToken = authenticateToken;
// VOLITELNÁ autentizace – když je token, načteme uživatele; když není, necháme projít
const authenticateTokenOptional = (req, _res, next) => {
    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader?.split(" ")[1];
        if (!token)
            return next();
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = decoded;
    }
    catch {
        // nevadí – prostě pokračuj bez uživatele
    }
    next();
};
exports.authenticateTokenOptional = authenticateTokenOptional;
// ✅ Požadované role
const requireRole = (...allowed) => (req, res, next) => {
    if (!req.user) {
        res.status(401).json({ message: "Nejste přihlášen." });
        return;
    }
    if (!allowed.includes(req.user.role)) {
        res.status(403).json({ message: "Nemáte oprávnění k této akci." });
        return;
    }
    next();
};
exports.requireRole = requireRole;
// ✅ Alias-y (kompatibilita)
exports.verifyUser = exports.authenticateToken;
exports.verifyAdmin = (0, exports.requireRole)("ADMIN", "SUPERADMIN");
exports.verifySuperadmin = (0, exports.requireRole)("SUPERADMIN");
