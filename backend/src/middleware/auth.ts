import type { Request, Response, NextFunction } from "express";
import db from "../utils/db";

// Rozšíříme si typ Request, aby mohl obsahovat informace o uživateli
export interface AuthRequest extends Request {
    user?: {
        id: number;
        email: string;
    }
}

// Nový middleware pro ověření jakéhokoliv přihlášeného uživatele
export const verifyUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const email = req.body.userEmail || req.header("x-user-email");
    if (!email) {
      res.status(401).json({ error: "Chybí e-mail pro ověření." });
      return;
    }

    const result = await db.query("SELECT id, email FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      res.status(403).json({ error: "Uživatel nenalezen." });
      return;
    }
    
    // Připojíme informace o uživateli k objektu `req` pro další použití
    req.user = result.rows[0];
    next();
  } catch (err) {
    console.error("Chyba při ověřování uživatele:", err);
    res.status(500).json({ error: "Interní chyba serveru při ověřování." });
  }
};

// Tvoje stávající funkce pro ověření admina, mírně upravená pro konzistenci
export const verifyAdmin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const email = req.body.userEmail || req.header("x-user-email");
    if (!email) {
      res.status(401).json({ error: "Chybí e-mail pro ověření administrátora." });
      return;
    }

    const result = await db.query("SELECT id, email, is_admin FROM users WHERE email = $1", [email]);
    
    if (result.rows.length === 0 || result.rows[0].is_admin !== true) {
      res.status(403).json({ error: "Přístup zamítnut. Musíš být administrátor." });
      return;
    }

    // Připojíme informace o uživateli i zde
    req.user = result.rows[0];
    next(); // ✅ Pokračuj, pokud je uživatel admin
  } catch (err) {
    console.error("Chyba při ověřování administrátora:", err);
    res.status(500).json({ error: "Interní chyba serveru." });
  }
};