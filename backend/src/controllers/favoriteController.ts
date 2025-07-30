// 📁 backend/src/controllers/favoriteController.ts
import { Request, Response } from "express";
import db from "../utils/db";

export const addFavorite = async (req: Request, res: Response) => {
  const userId = req.body.userId; // později z tokenu
  const recipeId = req.body.recipeId;

  if (!userId || !recipeId) {
    return res.status(400).json({ error: "Chybí userId nebo recipeId." });
  }

  try {
    await db.query(
      "INSERT INTO favorites (user_id, recipe_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [userId, recipeId]
    );
    return res.status(200).json({ message: "Recept přidán do oblíbených." });
  } catch (error) {
    console.error("Chyba při přidávání do oblíbených:", error);
    return res.status(500).json({ error: "Chyba serveru." });
  }
};

export const getFavorites = async (req: Request, res: Response) => {
  const userId = req.params.userId;

  try {
    const result = await db.query(
      "SELECT recipe_id FROM favorites WHERE user_id = $1",
      [userId]
    );
    return res.status(200).json(result.rows.map((r) => r.recipe_id));
  } catch (error) {
    console.error("Chyba při načítání oblíbených:", error);
    return res.status(500).json({ error: "Chyba serveru." });
  }
};