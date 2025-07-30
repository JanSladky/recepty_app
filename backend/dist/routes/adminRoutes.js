"use strict";
// 📁 backend/src/routes/adminRoutes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// 🔐 Kombinovaný middleware
const adminOnly = [auth_1.authenticateToken, auth_1.verifyAdmin];
router.get("/users", adminOnly, adminController_1.getAllUsers);
router.delete("/users/:id", adminOnly, adminController_1.deleteUser);
router.put("/users/:id/role", adminOnly, adminController_1.updateUserRole);
exports.default = router;
