"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAdmin = void 0;
const db_1 = __importDefault(require("../utils/db"));
const verifyAdmin = async (req, res, next) => {
    try {
        const email = req.header("x-user-email");
        if (!email) {
            res.status(401).json({ error: "Chybí e-mail v hlavičce." });
            return;
        }
        const result = await db_1.default.query("SELECT is_admin FROM users WHERE email = $1", [email]);
        if (result.rows.length === 0 || result.rows[0].is_admin !== true) {
            res.status(403).json({ error: "Přístup zamítnut. Musíš být administrátor." });
            return;
        }
        next(); // ✅ pokračuj, pokud je admin
    }
    catch (err) {
        console.error("Chyba při ověřování administrátora:", err);
        res.status(500).json({ error: "Interní chyba serveru." });
    }
};
exports.verifyAdmin = verifyAdmin;
