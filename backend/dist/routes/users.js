"use strict";
// 📁 Umístění: backend/src/routes/users.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = __importDefault(require("../utils/db"));
const router = express_1.default.Router();
/**
 * GET /api/users/email/:email
 * Vrací uživatele podle e-mailu (case-insensitive)
 */
router.get("/email/:email", async (req, res) => {
    const email = decodeURIComponent(req.params.email);
    console.log("📥 API dotaz na uživatele:", email);
    try {
        const { rows } = await db_1.default.query("SELECT * FROM users WHERE LOWER(email) = LOWER($1)", [email]);
        if (rows.length > 0) {
            console.log("✅ Uživatel nalezen:", rows[0]);
            res.status(200).json(rows[0]); // ✅ odpověď bez return
        }
        else {
            console.warn("❌ Uživatel nenalezen:", email);
            res.status(404).json({ error: "Uživatel nenalezen" });
        }
    }
    catch (error) {
        console.error("❌ Chyba při načítání uživatele:", error);
        res.status(500).json({ error: "Chyba serveru" });
    }
});
exports.default = router;
