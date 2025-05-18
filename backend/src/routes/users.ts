// routes/users.ts
import express from "express";
import db from "@utils/db";

const router = express.Router();

router.get("/email/:email", async (req, res) => {
  const email = decodeURIComponent(req.params.email);

  try {
    const { rows } = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ error: "Uživatel nenalezen" });
    }
  } catch (error) {
    console.error("❌ Chyba při načítání uživatele:", error);
    res.status(500).json({ error: "Chyba serveru" });
  }
});

export default router;
