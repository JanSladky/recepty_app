// 📁 src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "tajny_klic";

// rozšíření typu Request, aby měl `.user`
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        is_admin: boolean;
      };
    }
  }
}

// Middleware pro ověření JWT tokenu a připojení user objektu k req
export const authenticateToken = async (
  req: Request,
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

    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number;
      email: string;
      is_admin: boolean;
    };

    req.user = {
      id: decoded.id,
      email: decoded.email,
      is_admin: decoded.is_admin,
    };

    next();
  } catch (error) {
    res.status(403).json({ message: "Neplatný nebo expirovaný token." });
  }
};

// Middleware pro ověření, že uživatel je admin
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user?.is_admin) {
    res.status(403).json({ message: "Přístup odepřen. Vyžadována administrátorská práva." });
    return;
  }
  next();
};