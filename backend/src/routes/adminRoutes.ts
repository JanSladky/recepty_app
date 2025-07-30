// 📁 backend/src/routes/adminRoutes.ts

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

// 🔐 Kombinovaný middleware
const adminOnly = [authenticateToken, verifyAdmin];

router.get("/users", adminOnly, getAllUsers);
router.delete("/users/:id", adminOnly, deleteUser);
router.put("/users/:id/role", adminOnly, updateUserRole);

export default router;