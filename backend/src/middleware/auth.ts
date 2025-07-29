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
    // FINÁLNÍ OPRAVA: Bezpečně zkontrolujeme, zda req.body existuje, než se z něj pokusíme číst.
    const email = (req.body && req.body.userEmail) || req.header("x-user-email");
    
    if (!email) {
      res.status(401).json({ error: "Chybí e-mail pro ověření." });
      return;
    }

    const result = await db.query("SELECT id, email FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      res.status(403).json({ error: "Uživatel nenalezen." });
      return;
    }
    
    req.user = result.rows[0]; // Připojíme info o uživateli k požadavku
    next();
  } catch (err) {
    console.error("🔥 Kritická chyba v middleware 'verifyUser':", err);
    res.status(500).json({ error: "Interní chyba serveru při ověřování.", detail: (err as Error).message });
  }
};

// Tvoje stávající funkce pro ověření admina (zůstává)
export const verifyAdmin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    // FINÁLNÍ OPRAVA: Stejnou bezpečnou kontrolu přidáme i sem pro konzistenci.
    const email = (req.body && req.body.userEmail) || req.header("x-user-email");

    if (!email) {
      res.status(401).json({ error: "Chybí e-mail pro ověření." });
      return;
    }
    try {
        const result = await db.query("SELECT id, email, is_admin FROM users WHERE email = $1", [email]);
        if (result.rows.length === 0 || !result.rows[0].is_admin) {
            res.status(403).json({ error: "Přístup zamítnut. Musíš být administrátor." });
            return;
        }
        req.user = result.rows[0];
        next();
    } catch (err) {
        console.error("🔥 Kritická chyba v middleware 'verifyAdmin':", err);
        res.status(500).json({ error: "Interní chyba serveru při ověřování.", detail: (err as Error).message });
    }
};
