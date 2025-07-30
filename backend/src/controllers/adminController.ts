import { Request, Response } from "express";
import db from "../utils/db";

// ✅ Získání všech uživatelů
export const getAllUsers = async (_req: Request, res: Response) => {
  try {
    const { rows } = await db.query("SELECT id, name, email, is_admin FROM users ORDER BY id ASC");
    res.json(rows);
  } catch (err) {
    console.error("❌ Chyba při načítání uživatelů:", err);
    res.status(500).json({ error: "Chyba serveru" });
  }
};

// ✅ Smazání uživatele
export const deleteUser = async (req: Request, res: Response) => {
  const userId = req.params.id;
  try {
    const result = await db.query("DELETE FROM users WHERE id = $1", [userId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Uživatel nenalezen" });
    }
    res.json({ message: "Uživatel úspěšně smazán" });
  } catch (err) {
    console.error("❌ Chyba při mazání uživatele:", err);
    res.status(500).json({ error: "Chyba serveru" });
  }
};

// ✅ Změna role
export const toggleAdmin = async (req: Request, res: Response) => {
  const userId = req.params.id;
  const { is_admin } = req.body;
  try {
    await db.query("UPDATE users SET is_admin = $1 WHERE id = $2", [is_admin, userId]);
    res.json({ message: "Role upravena" });
  } catch (err) {
    console.error("❌ Chyba při změně role:", err);
    res.status(500).json({ error: "Chyba serveru" });
  }
};