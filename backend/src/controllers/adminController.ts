import { Request, Response } from "express";
import db from "../utils/db";
import type { AuthRequest } from "../middleware/auth";

// ✅ Seznam všech uživatelů
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await db.query("SELECT id, name, email, is_admin FROM users ORDER BY id");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Chyba při načítání uživatelů:", error);
    res.status(500).json({ error: "Serverová chyba." });
  }
};

// ✅ Smazání uživatele
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = parseInt(req.params.id);

  try {
    await db.query("DELETE FROM users WHERE id = $1", [userId]);
    res.status(200).json({ message: "Uživatel smazán." });
  } catch (error) {
    console.error("Chyba při mazání uživatele:", error);
    res.status(500).json({ error: "Serverová chyba." });
  }
};

// ✅ Změna role uživatele
export const updateUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = parseInt(req.params.id);
  const { is_admin } = req.body;

  try {
    await db.query("UPDATE users SET is_admin = $1 WHERE id = $2", [is_admin, userId]);
    res.status(200).json({ message: "Role uživatele změněna." });
  } catch (error) {
    console.error("Chyba při změně role:", error);
    res.status(500).json({ error: "Serverová chyba." });
  }
};