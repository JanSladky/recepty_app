import type { Response, Request } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../utils/db";
import { cloudinary } from "../utils/cloudinary";

import { getUserByEmailFromDB } from "../models/userModel";

const JWT_SECRET = process.env.JWT_SECRET || "tajny_klic";

// ✅ Přihlášení uživatele
export const loginUser = async (req: Request, res: Response): Promise<void> => {
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
        avatar_url: user.avatar_url,
      },
    });
  } catch (error) {
    console.error("Chyba při přihlášení:", error);
    res.status(500).json({ error: "Chyba serveru při přihlášení." });
  }
};

// ✅ Změna avataru
export const updateAvatar = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Neautorizováno" });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ message: "Nebyl nahrán žádný soubor." });
      return;
    }

    // Upload do Cloudinary
    const base64 = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
    const uploadResult = await cloudinary.uploader.upload(base64, {
      folder: "avatars",
    });

    // Update v DB
    await db.query("UPDATE users SET avatar_url = $1 WHERE id = $2", [uploadResult.secure_url, userId]);

    res.status(200).json({ message: "Avatar byl aktualizován", avatar_url: uploadResult.secure_url });
  } catch (error) {
    console.error("❌ Chyba při nahrávání avataru:", error);
    res.status(500).json({ error: "Chyba serveru při nahrávání avataru" });
  }
};

// ✅ Reset hesla
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
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
export const getMyFavorites = async (req: Request, res: Response): Promise<void> => {
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
export const toggleFavorite = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const recipeId = parseInt(req.params.id);

    if (!userId || isNaN(recipeId)) {
      res.status(400).json({ message: "Neplatné ID uživatele nebo receptu." });
      return;
    }

    const existing = await db.query("SELECT * FROM favorites WHERE user_id = $1 AND recipe_id = $2", [userId, recipeId]);

    if (existing.rows.length > 0) {
      await db.query("DELETE FROM favorites WHERE user_id = $1 AND recipe_id = $2", [userId, recipeId]);
      res.status(200).json({ message: "Recept odebrán z oblíbených." });
    } else {
      await db.query("INSERT INTO favorites (user_id, recipe_id) VALUES ($1, $2)", [userId, recipeId]);
      res.status(200).json({ message: "Recept přidán do oblíbených." });
    }
  } catch (error) {
    console.error("Chyba při úpravě oblíbených:", error);
    res.status(500).json({ error: "Chyba serveru." });
  }
};

// ✅ Generování nákupního seznamu z oblíbených receptů
export const generateShoppingList = async (req: Request, res: Response): Promise<void> => {
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

// ✅ Placeholder – budoucí generování nákupního seznamu z plánu
export const generateShoppingListFromPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Neautorizovaný přístup." });
      return;
    }

    res.status(200).json({ message: "Funkce zatím není implementována." });
  } catch (error) {
    console.error("Chyba při generování nákupního seznamu z plánu:", error);
    res.status(500).json({ error: "Chyba serveru." });
  }
};

// ✅ Vrací info o přihlášeném uživateli (token)
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "Neautorizovaný přístup." });
    return;
  }
  res.status(200).json(req.user);
};

// ✅ Získání uživatele podle emailu (pro `useAdmin`)
export const getUserByEmail = async (req: Request, res: Response): Promise<void> => {
  const email = req.query.email as string;

  if (!email) {
    res.status(400).json({ error: "Chybí parametr email" });
    return;
  }

  try {
    const user = await getUserByEmailFromDB(email);
    if (!user) {
      res.status(404).json({ error: "Uživatel nenalezen" });
      return;
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Chyba při získávání uživatele podle emailu:", error);
    res.status(500).json({ error: "Chyba serveru." });
  }
};
