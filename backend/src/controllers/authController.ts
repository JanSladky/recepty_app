import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../utils/db";
import nodemailer from "nodemailer";

const JWT_SECRET = process.env.JWT_SECRET || "tajny_klic";
type Role = "SUPERADMIN" | "ADMIN" | "USER";

/* ---------- Email utilita ---------- */

const APP_URL = process.env.APP_URL ?? "https://recepty-app.vercel.app";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@example.com";

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn("⚠️ SMTP není plně nastaven (SMTP_HOST/USER/PASS). E-maily se neodešlou.");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });
}

async function sendEmail(to: string, subject: string, html: string) {
  const transporter = createTransporter();
  try {
    await transporter.sendMail({
      from: `"Recepty" <${process.env.SMTP_USER ?? "no-reply@recepty.app"}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error("✉️  Odeslání e-mailu selhalo:", err);
  }
}

function emailShell(inner: string) {
  // jednoduchý “brand” kabátek v barvách aplikace
  return `
  <div style="background:#f3f4f6;padding:24px;font-family:Inter,Segoe UI,Arial,sans-serif;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 6px 18px rgba(0,0,0,0.06)">
      <div style="background:#16a34a;padding:18px 24px;color:#fff;">
        <table width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="font-size:20px;font-weight:800;letter-spacing:.2px;">🍽 Recepty</td>
            <td align="right" style="font-size:12px;opacity:.9;">
              <a href="${APP_URL}" style="color:#fff;text-decoration:none;">${APP_URL.replace(/^https?:\/\//,'')}</a>
            </td>
          </tr>
        </table>
      </div>
      <div style="padding:28px 24px;color:#111827;line-height:1.6;">
        ${inner}
      </div>
      <div style="background:#f9fafb;padding:18px 24px;color:#6b7280;font-size:12px;text-align:center;">
        © ${new Date().getFullYear()} Recepty – Všechna práva vyhrazena
      </div>
    </div>
  </div>`;
}

function welcomeEmail(userName: string) {
  const content = `
    <h2 style="margin:0 0 8px 0;color:#111827;">Vítej, ${userName || "kuchaři"}! 👋</h2>
    <p>Děkujeme za registraci v aplikaci <strong>Recepty</strong>. Jsme rádi, že vaříš s námi! 🍲</p>
    <p>Začni na svém přehledu a objev všechny funkce:</p>
    <p>
      <a href="${APP_URL}/dashboard"
         style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600">
        Přejít na Dashboard
      </a>
    </p>
    <p style="font-size:12px;color:#6b7280;margin-top:20px">Pokud jsi se neregistroval ty, ignoruj prosím tento e-mail.</p>
  `;
  return emailShell(content);
}

function adminNewUserEmail(name: string | null, email: string) {
  const content = `
    <h3 style="margin:0 0 10px 0;color:#111827;">Nový registrovaný uživatel 🆕</h3>
    <table cellspacing="0" cellpadding="0" style="font-size:14px;color:#111827">
      <tr><td style="padding:6px 0;width:120px;color:#6b7280">Jméno:</td><td><strong>${name ?? "—"}</strong></td></tr>
      <tr><td style="padding:6px 0;width:120px;color:#6b7280">E-mail:</td><td><a href="mailto:${email}">${email}</a></td></tr>
    </table>
    <p style="margin-top:16px">
      <a href="${APP_URL}/dashboard"
         style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:10px 14px;border-radius:8px;font-weight:600">
        Otevřít administraci
      </a>
    </p>
  `;
  return emailShell(content);
}

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

    const user = insert.rows[0] as { id: number; name: string | null; email: string; avatar_url: string | null; role: Role };

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    /* ✉️  ODESLÁNÍ EMAILŮ – neblokující pro registraci (chyby se logují, ale nevrací 5xx) */
    try {
      await Promise.allSettled([
        sendEmail(user.email, "Vítej v Recepty 🎉", welcomeEmail(user.name ?? "")),
        sendEmail(ADMIN_EMAIL, "Nový uživatel na Recepty", adminNewUserEmail(user.name ?? null, user.email)),
      ]);
    } catch (e) {
      // bezpečný fallback – nechceme rozbít registraci kvůli e-mailu
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