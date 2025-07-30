import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Získáme typ pro JWT payload
interface JwtPayload {
  id: number;
  email: string;
  is_admin: boolean;
}

// Rozšířený typ Request s uživatelem
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

const JWT_SECRET = process.env.JWT_SECRET || "tajny_klic";

// Middleware pro ověření přihlášeného uživatele
export const verifyUser = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Chybí nebo neplatný autorizační token." });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
    console.error("❌ Chyba při ověření tokenu:", err);
    res.status(401).json({ error: "Neplatný nebo expirovaný token." });
  }
};

// Middleware pro ověření administrátora
export const verifyAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Chybí nebo neplatný autorizační token." });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    if (!decoded.is_admin) {
      res.status(403).json({ error: "Přístup zakázán. Musíš být administrátor." });
      return;
    }

    req.user = decoded;
    next();
  } catch (err) {
    console.error("❌ Chyba při ověření admina:", err);
    res.status(401).json({ error: "Neplatný nebo expirovaný token." });
  }
};