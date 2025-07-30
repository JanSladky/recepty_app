import { Request, Response } from "express";
import db from "../utils/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "tajny_klic";

// ✅ Registrace nového uživatele
export const registerUser = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: "Všechna pole jsou povinná." });
  }

  try {
    const existing = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Uživatel s tímto e-mailem již existuje." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { rows } = await db.query(
      "INSERT INTO users (name, email, password, is_admin) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, email, hashedPassword, false]
    );

    const { password: _, ...userWithoutPassword } = rows[0];

    return res.status(201).json({ message: "Uživatel úspěšně registrován", user: userWithoutPassword });
  } catch (err) {
    console.error("❌ Chyba registrace:", err);
    return res.status(500).json({ error: "Chyba serveru" });
  }
};

// ✅ Přihlášení uživatele
export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const { rows } = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = rows[0];

    if (!user) {
      return res.status(404).json({ error: "Uživatel nenalezen" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: "Neplatné heslo" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, is_admin: user.is_admin },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const { password: _, ...userWithoutPassword } = user;

    res.json({ message: "Přihlášení úspěšné", token, user: userWithoutPassword });
  } catch (err) {
    console.error("❌ Chyba přihlášení:", err);
    res.status(500).json({ error: "Chyba serveru" });
  }
};

// ✅ Získání uživatele podle e-mailu (např. pro načtení profilu)
export const getUserByEmail = async (req: Request, res: Response) => {
  const email = req.query.email as string;

  try {
    const { rows } = await db.query("SELECT * FROM users WHERE LOWER(email) = LOWER($1)", [email]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Uživatel nenalezen" });
    }

    const { password: _, ...userData } = rows[0]; // skryj heslo
    res.json(userData);
  } catch (err) {
    console.error("❌ Chyba při získávání uživatele:", err);
    res.status(500).json({ error: "Chyba serveru" });
  }
};