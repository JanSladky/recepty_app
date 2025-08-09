// backend/src/controllers/authController.ts
import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../utils/db";

// 👇 email utils + šablony
import { sendEmail } from "../utils/sendEmail";
import { welcomeEmail } from "../templates/welcomeEmail";
import { newUserNotification } from "../templates/newUserNotification";

const JWT_SECRET = process.env.JWT_SECRET || "tajny_klic";
type Role = "SUPERADMIN" | "ADMIN" | "USER";

const APP_URL = process.env.APP_URL ?? "https://recepty-app.vercel.app";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@example.com";

/**
 * POST /api/auth/register
 * Vytvoří uživatele (role se bere z DB default = 'USER')
 */
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, avatar_url } = req.body as {
      name: string;
      email: string;
      password: string;
      avatar_url?: string;
    };

    if (!name || !email || !password) {
      res.status(400).json({ error: "Jméno, e-mail i heslo jsou povinné." });
      return;
    }

    // unikátní email (case-insensitive)
    const exist = await db.query("SELECT 1 FROM users WHERE LOWER(email) = LOWER($1)", [email]);
    if (exist.rows.length > 0) {
      res.status(409).json({ error: "Uživatel s tímto e-mailem už existuje." });
      return;
    }

    const hash = await bcrypt.hash(password, 10);

    // role neuvádíme → použije se DEFAULT 'USER'
    const insert = await db.query(
      `INSERT INTO users (name, email, password, avatar_url)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, avatar_url, role`,
      [name, email, hash, avatar_url ?? null]
    );

    const user = insert.rows[0] as {
      id: number;
      name: string | null;
      email: string;
      avatar_url: string | null;
      role: Role;
    };

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ✉️ Odeslat e-maily (neblokující)
    try {
      await Promise.allSettled([
        sendEmail(user.email, "Vítej v Recepty 🎉", welcomeEmail(user.name ?? "")),
        sendEmail(ADMIN_EMAIL, "Nový uživatel na Recepty", newUserNotification(user.name ?? "—", user.email)),
      ]);
    } catch (e) {
      console.warn("⚠️ Problém při odeslání e-mailů po registraci:", e);
    }

    res.status(201).json({ message: "Registrace úspěšná.", token, user });
  } catch (error) {
    console.error("❌ Chyba registrace:", error);
    res.status(500).json({ error: "Serverová chyba při registraci." });
  }
};

/**
 * POST /api/auth/login
 * Přihlášení – vrací token s { id, email, role } a uživatele bez hesla
 */
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    if (!email || !password) {
      res.status(400).json({ error: "E-mail i heslo jsou povinné." });
      return;
    }

    const result = await db.query(
      "SELECT id, name, email, password, avatar_url, role FROM users WHERE LOWER(email) = LOWER($1)",
      [email]
    );
    const user = result.rows[0] as
      | { id: number; name: string | null; email: string; password: string; avatar_url: string | null; role: Role }
      | undefined;

    if (!user) {
      res.status(404).json({ error: "Uživatel nenalezen." });
      return;
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      res.status(401).json({ error: "Neplatné heslo." });
      return;
    }

    const { password: _omit, ...safeUser } = user;

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({ message: "Přihlášení úspěšné.", token, user: safeUser });
  } catch (error) {
    console.error("❌ Chyba přihlášení:", error);
    res.status(500).json({ error: "Serverová chyba při přihlášení." });
  }
};

/**
 * GET /api/auth/me (nebo /api/user/email?email=...)
 * Vrátí info o uživateli – doporučené je /me s JWT
 */
export const getUserByEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const email = req.query.email as string;
    if (!email) {
      res.status(400).json({ error: "Chybí parametr 'email'." });
      return;
    }

    const result = await db.query(
      "SELECT id, name, email, role, avatar_url FROM users WHERE LOWER(email) = LOWER($1)",
      [email]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Uživatel nenalezen." });
      return;
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("❌ Chyba při získání uživatele podle e-mailu:", error);
    res.status(500).json({ error: "Serverová chyba." });
  }
};