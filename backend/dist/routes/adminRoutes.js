"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// 📁 backend/src/routes/adminRoutes.ts
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// všechny admin endpointy: musí být přihlášen + musí být SUPERADMIN
router.use(auth_1.authenticateToken);
// ✅ Seznam uživatelů – jen SUPERADMIN
router.get("/users", (0, auth_1.requireRole)("SUPERADMIN"), adminController_1.getAllUsers);
// ✅ Změna role – jen SUPERADMIN
router.patch("/users/:id/role", (0, auth_1.requireRole)("SUPERADMIN"), adminController_1.updateUserRole);
// ✅ Smazání uživatele – jen SUPERADMIN
router.delete("/users/:id", (0, auth_1.requireRole)("SUPERADMIN"), adminController_1.deleteUser);
exports.default = router;
