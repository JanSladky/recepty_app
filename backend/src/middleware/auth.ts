import type { Request, Response, NextFunction } from "express";
import db from "../utils/db";

export const verifyAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // --- FINÁLNÍ OPRAVA ---
    // Middleware musí být robustní a zkontrolovat obě možná umístění emailu.
    // 1. Zkusíme ho najít v 'body' (pro formuláře s obrázkem).
    // 2. Pokud tam není, zkusíme ho najít v hlavičce (pro jednoduché požadavky jako DELETE).
    const email = req.body.userEmail || req.header("x-user-email");

    if (!email) {
      // Aktualizovaná chybová hláška
      res.status(401).json({ error: "Chybí e-mail pro ověření administrátora." });
      return;
    }

    const result = await db.query("SELECT is_admin FROM users WHERE email = $1", [email]);
    
    if (result.rows.length === 0 || result.rows[0].is_admin !== true) {
      res.status(403).json({ error: "Přístup zamítnut. Musíš být administrátor." });
      return;
    }

    next(); // ✅ Pokračuj, pokud je uživatel admin
  } catch (err) {
    console.error("Chyba při ověřování administrátora:", err);
    res.status(500).json({ error: "Interní chyba serveru." });
  }
};
