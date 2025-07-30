import { Router } from "express";

import {
  getAllUsers,
  deleteUser,
  updateUserRole,
} from "../controllers/adminController";

import {
  authenticateToken,
  verifyAdmin,
} from "../middleware/auth";

const router = Router();

// 🔐 Kombinovaný middleware pro adminy
const adminOnly = [authenticateToken, verifyAdmin];

// ✅ Získání všech uživatelů
router.get("/users", adminOnly, getAllUsers);

// ✅ Smazání uživatele dle ID
router.delete("/users/:id", adminOnly, deleteUser);

// ✅ Změna role uživatele (admin <-> user)
router.put("/users/:id/role", adminOnly, updateUserRole);

export default router;