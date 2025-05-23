// Pokud jsi v Express backendu (např. v /backend)
import { Request, Response } from "express";
import db from "../../utils/db";

export async function updateIngredient(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Neplatné ID." });

  const { name, category, calories_per_gram } = req.body;

  if (!name || typeof calories_per_gram !== "number") {
    return res.status(400).json({ error: "Neplatná data." });
  }

  try {
    await db.query(
      "UPDATE ingredients SET name = $1, category = $2, calories_per_gram = $3 WHERE id = $4",
      [name, category, calories_per_gram, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Chyba při aktualizaci suroviny:", err);
    res.status(500).json({ error: "Server error" });
  }
}

export async function deleteIngredient(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Neplatné ID." });

  try {
    await db.query("DELETE FROM ingredients WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Chyba při mazání suroviny:", err);
    res.status(500).json({ error: "Server error" });
  }
}