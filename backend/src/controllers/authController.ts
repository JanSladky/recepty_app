import { Request, Response } from "express";
import db from "../utils/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "tajny_klic";

// ✅ Registrace nového uživatele
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, avatar_url } = req.body; // ⬅ přidáno avatar_url

  if (!email || !password || !name) {
    res.status(400).json({ error: "Všechna pole jsou povinná." });
    return;
  }

  try {
    const existing = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      res.status(400).json({ error: "Uživatel s tímto e-mailem již existuje." });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { rows } = await db.query(
      `INSERT INTO users (name, email, password, is_admin, avatar_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, is_admin, avatar_url`,
      [name, email, hashedPassword, false, avatar_url] // ⬅ avatar_url doplněn
    );

    const user = rows[0];
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      message: "Uživatel úspěšně registrován",
      token,
      user,
    });
  } catch (err) {
    console.error("❌ Chyba registrace:", err);
    res.status(500).json({ error: "Chyba serveru" });
  }
};

// ✅ Přihlášení uživatele
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email i heslo jsou povinné." });
    return;
  }

  try {
    const { rows } = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = rows[0];

    if (!user) {
      res.status(404).json({ error: "Uživatel nenalezen." });
      return;
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      res.status(401).json({ error: "Neplatné heslo." });
      return;
    }

    const { password: _, ...userWithoutPassword } = user;
    const token = jwt.sign(userWithoutPassword, JWT_SECRET, { expiresIn: "7d" });

    res.status(200).json({
      message: "Přihlášení úspěšné",
      token,
      user: userWithoutPassword,
    });
  } catch (err) {
    console.error("❌ Chyba přihlášení:", err);
    res.status(500).json({ error: "Chyba serveru" });
  }
};

// ✅ Získání uživatele podle e-mailu (např. pro profil)
export const getUserByEmail = async (req: Request, res: Response): Promise<void> => {
  const email = req.query.email as string;

  if (!email) {
    res.status(400).json({ error: "Email je povinný parametr." });
    return;
  }

  try {
    const { rows } = await db.query("SELECT id, name, email, is_admin FROM users WHERE LOWER(email) = LOWER($1)", [email]);

    if (rows.length === 0) {
      res.status(404).json({ error: "Uživatel nenalezen." });
      return;
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("❌ Chyba při načítání uživatele:", err);
    res.status(500).json({ error: "Chyba serveru" });
  }
};
