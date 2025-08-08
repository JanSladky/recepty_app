// 📁 backend/src/routes/adminRoutes.ts
import { Router } from "express";
import { getAllUsers, deleteUser, updateUserRole } from "../controllers/adminController";
import { authenticateToken, requireRole } from "../middleware/auth";

const router = Router();

// všechny admin endpointy: musí být přihlášen + musí být SUPERADMIN
router.use(authenticateToken);

// ✅ Seznam uživatelů – jen SUPERADMIN
router.get("/users", requireRole("SUPERADMIN"), getAllUsers);

// ✅ Změna role – jen SUPERADMIN
router.patch("/users/:id/role", requireRole("SUPERADMIN"), updateUserRole);

// ✅ Smazání uživatele – jen SUPERADMIN
router.delete("/users/:id", requireRole("SUPERADMIN"), deleteUser);

export default router;