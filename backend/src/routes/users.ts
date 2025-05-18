// routes/users.ts
import express from "express";
import db from "@utils/db";

const router = express.Router();

router.get("/:email", async (req, res) => {
  const email = req.params.email;
  try {
    const { rows } = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ error: "Uživatel nenalezen" });
    }
  } catch (error) {
    res.status(500).json({ error: "Chyba při načítání uživatele" });
  }
});

export default router;
