import type { Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../utils/db";
import type { AuthRequest } from "../middleware/auth";

const JWT_SECRET = process.env.JWT_SECRET || "tajny_klic";

// ✅ Přihlášení uživatele
export const loginUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];

    if (!user) {
      res.status(401).json({ message: "Neplatné přihlašovací údaje." });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      res.status(401).json({ message: "Neplatné přihlašovací údaje." });
      return;
    }

    const token = jwt.sign({ id: user.id, email: user.email, is_admin: user.is_admin }, JWT_SECRET, { expiresIn: "1d" });

    res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        is_admin: user.is_admin,
      },
    });
  } catch (error) {
    console.error("Chyba při přihlášení:", error);
    res.status(500).json({ error: "Chyba serveru při přihlášení." });
  }
};

// ✅ Reset hesla pro uživatele podle e-mailu
export const resetPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, newPassword } = req.body;

  try {
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);

    const result = await db.query("UPDATE users SET password = $1 WHERE email = $2", [hashed, email]);

    if (result.rowCount === 0) {
      res.status(404).json({ message: "Uživatel s tímto e-mailem neexistuje." });
      return;
    }

    res.status(200).json({ message: "Heslo bylo úspěšně změněno." });
  } catch (error) {
    console.error("Chyba při resetování hesla:", error);
    res.status(500).json({ error: "Chyba serveru při resetu hesla." });
  }
};

// ✅ Získání oblíbených receptů přihlášeného uživatele
export const getMyFavorites = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Neautorizovaný přístup." });
      return;
    }

    const result = await db.query(
      `SELECT r.* FROM recipes r
       JOIN favorites f ON r.id = f.recipe_id
       WHERE f.user_id = $1`,
      [userId]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Chyba při načítání oblíbených receptů:", error);
    res.status(500).json({ error: "Chyba serveru." });
  }
};

// ✅ Přidání nebo odebrání receptu z oblíbených
export const toggleFavorite = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const recipeId = parseInt(req.params.id);

    console.log("🔁 toggleFavorite");
    console.log("➡️ userId:", userId);
    console.log("➡️ recipeId:", recipeId);

    if (!userId || isNaN(recipeId)) {
      console.log("❌ Neplatné ID!");
      res.status(400).json({ message: "Neplatné ID uživatele nebo receptu." });
      return;
    }

    const existing = await db.query("SELECT * FROM favorites WHERE user_id = $1 AND recipe_id = $2", [userId, recipeId]);

    console.log("📦 existující záznam:", existing.rows);

    if (existing.rows.length > 0) {
      await db.query("DELETE FROM favorites WHERE user_id = $1 AND recipe_id = $2", [userId, recipeId]);
      console.log("🗑️ Recept odebrán z oblíbených");
      res.status(200).json({ message: "Recept odebrán z oblíbených." });
    } else {
      await db.query("INSERT INTO favorites (user_id, recipe_id) VALUES ($1, $2)", [userId, recipeId]);
      console.log("⭐ Recept přidán do oblíbených");
      res.status(200).json({ message: "Recept přidán do oblíbených." });
    }
  } catch (error) {
    console.error("❌ Chyba při úpravě oblíbených:", error);
    res.status(500).json({ error: "Chyba serveru." });
  }
};

// ✅ Generování nákupního seznamu z oblíbených receptů
export const generateShoppingList = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Neautorizovaný přístup." });
      return;
    }

    const result = await db.query(
      `SELECT i.name, ri.quantity, ri.unit
       FROM recipes r
       JOIN favorites f ON f.recipe_id = r.id
       JOIN recipe_ingredients ri ON ri.recipe_id = r.id
       JOIN ingredients i ON i.id = ri.ingredient_id
       WHERE f.user_id = $1`,
      [userId]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Chyba při generování nákupního seznamu:", error);
    res.status(500).json({ error: "Chyba serveru." });
  }
};
// ✅ Generování nákupního seznamu ze všech receptů v plánu vaření
export const generateShoppingListFromPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Neautorizovaný přístup." });
      return;
    }

    const planResult = await db.query(`SELECT recipe_id FROM cooking_plan WHERE user_id = $1`, [userId]);

    const recipeIds = planResult.rows.map((row) => row.recipe_id);
    if (recipeIds.length === 0) {
      res.status(200).json([]);
      return; // ukončí funkci bez návratu hodnoty
    }

    const result = await db.query(
      `SELECT i.name, SUM(ri.quantity) AS total_quantity, ri.unit
       FROM recipe_ingredients ri
       JOIN ingredients i ON ri.ingredient_id = i.id
       WHERE ri.recipe_id = ANY($1)
       GROUP BY i.name, ri.unit
       ORDER BY i.name`,
      [recipeIds]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("❌ Chyba při generování seznamu z plánu:", error);
    res.status(500).json({ error: "Chyba serveru při generování nákupního seznamu." });
  }
};
