import express from "express";
import db from "../utils/db"; // nebo "@utils/db" podle tvého tsconfigu

const router = express.Router();

/**
 * GET /api/users/email/:email
 * Vrací uživatele podle e-mailu (case-insensitive)
 */
router.get("/email/:email", async (req, res) => {
  const email = decodeURIComponent(req.params.email);
  console.log("📥 API dotaz na uživatele:", email);

  try {
    const { rows } = await db.query("SELECT * FROM users WHERE LOWER(email) = LOWER($1)", [email]);

    if (rows.length > 0) {
      console.log("✅ Uživatel nalezen:", rows[0]);
      res.json(rows[0]);
    } else {
      console.warn("❌ Uživatel nenalezen:", email);
      res.status(404).json({ error: "Uživatel nenalezen" });
    }
  } catch (error) {
    console.error("❌ Chyba při načítání uživatele:", error);
    res.status(500).json({ error: "Chyba serveru" });
  }
});

export default router;
