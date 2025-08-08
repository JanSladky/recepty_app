// 📁 backend/src/middleware/auth.ts
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "tajny_klic";

export type Role = "SUPERADMIN" | "ADMIN" | "USER";

export interface JwtPayload {
  id: number;
  email: string;
  role: Role;
}

// ✅ Globální augmentace Express.Request → přidá .user všude
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// Volitelně, pro kompatibilitu s dřívějšími importy
export type AuthRequest = Request;

// ✅ Ověření JWT
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.split(" ")[1];

    if (!token) {
      res.status(401).json({ message: "Chybí token." });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(403).json({ message: "Neplatný nebo expirovaný token." });
  }
};

// ✅ Požadované role
export const requireRole =
  (...allowed: Role[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "Nejste přihlášen." });
      return;
    }
    if (!allowed.includes(req.user.role)) {
      res.status(403).json({ message: "Nemáte oprávnění k této akci." });
      return;
    }
    next();
  };

// ✅ Alias-y (kompatibilita)
export const verifyUser = authenticateToken;
export const verifyAdmin = requireRole("ADMIN", "SUPERADMIN");
export const verifySuperadmin = requireRole("SUPERADMIN");