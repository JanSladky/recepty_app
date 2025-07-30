// 📁 Umístění: backend/src/routes/users.ts

import express from "express";
import { Request, Response } from "express";
import db from "../utils/db";

const router = express.Router();

/**
 * GET /api/users/email?email=neco@neco.cz
 * Vrací uživatele podle e-mailu (case-insensitive)
 */
router.get("/email", async (req: Request, res: Response): Promise<void> => {
  const emailParam = req.query.email;

  if (!emailParam || typeof emailParam !== "string") {
    res.status(400).json({ error: "Email musí být zadán jako query parametr (?email=...)" });
    return;
  }

  const email = decodeURIComponent(emailParam);
  console.log("📥 API dotaz na uživatele:", email);

  try {
    const { rows } = await db.query(
      "SELECT * FROM users WHERE LOWER(email) = LOWER($1)",
      [email]
    );

    if (rows.length > 0) {
      console.log("✅ Uživatel nalezen:", rows[0]);
      res.status(200).json(rows[0]);
    } else {
      console.warn("❌ Uživatel nenalezen:", email);
      res.status(404).json({ error: "Uživatel nenalezen" });
    }
  } catch (error) {
    console.error("❌ Chyba při načítání uživatele:", error);
    res.status(500).json({ error: "Chyba serveru" });
  }
});

// 👇 Tohle je důležité pro správné fungování importu
export default router;