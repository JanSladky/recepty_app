import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "tajny_klic";

// ✅ Typ role
export type Role = "SUPERADMIN" | "ADMIN" | "USER";

// ✅ JWT payload typ
export interface JwtPayload {
  id: number;
  email: string;
  role: Role;
}

// ✅ Request rozšířený o uživatele
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// ✅ Middleware: Ověření tokenu
export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      res.status(401).json({ message: "Chybí token." });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ message: "Neplatný nebo expirovaný token." });
  }
};

// ✅ Middleware: Ověření konkrétní role/rolí
export const requireRole = (...allowedRoles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ message: "Nejste přihlášen." });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ message: "Nemáte oprávnění k této akci." });
      return;
    }
    next();
  };
};

// ✅ Alias pro běžného uživatele (stačí být přihlášen)
export const verifyUser = authenticateToken;