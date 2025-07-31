// 📁 backend/src/middleware/auth.ts

import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// JWT payload typ
interface JwtPayload {
  id: number;
  email: string;
  is_admin: boolean;
}

// Rozšířený Request typ
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

const JWT_SECRET = process.env.JWT_SECRET || "tajny_klic";

// ✅ Middleware: Ověření tokenu a připojení uživatele k req
export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    console.log("🛡️ Authorization header:", authHeader);
    console.log("🛡️ Token:", token);

    if (!token) {
      console.warn("❌ Chybí token!");
      res.status(401).json({ message: "Chybí token." });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    console.log("✅ JWT decoded:", decoded);

    // ✅ Uložení uživatele do requestu
    (req as AuthRequest).user = decoded;

    next();
  } catch (error) {
    console.error("❌ Neplatný token:", error);
    res.status(403).json({ message: "Neplatný nebo expirovaný token." });
  }
};

// ✅ Middleware: Ověření admin práv
export const verifyAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  console.log("🔐 verifyAdmin - req.user:", req.user);
  if (!req.user?.is_admin) {
    console.warn("⛔ Přístup zamítnut. Není administrátor:", req.user);
    res.status(403).json({ message: "Přístup pouze pro administrátory." });
    return;
  }

  next();
};
export const verifyUser = authenticateToken;
