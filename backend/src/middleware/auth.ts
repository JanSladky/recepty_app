import type { Request, Response, NextFunction } from "express";
import db from "../utils/db";

export const verifyAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userEmail } = req.body;

    if (!userEmail) {
      res.status(401).json({ error: "Chybí e-mail pro ověření administrátora." });
      return;
    }

    const result = await db.query("SELECT is_admin FROM users WHERE email = $1", [userEmail]);

    if (result.rows.length === 0 || result.rows[0].is_admin !== true) {
      res.status(403).json({ error: "Přístup zamítnut. Musíš být administrátor." });
      return;
    }

    next();
  } catch (err) {
    console.error("Chyba při ověřování administrátora:", err);
    res.status(500).json({ error: "Interní chyba serveru." });
  }
};
