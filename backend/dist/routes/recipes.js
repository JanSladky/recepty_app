"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// 📁 backend/src/routes/recipes.ts
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const cloudinary_1 = require("../utils/cloudinary");
const auth_1 = require("../middleware/auth");
const recipeController_1 = require("../controllers/recipeController");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: cloudinary_1.storage });
// --- Veřejné GET seznam ---
router.get("/", recipeController_1.getRecipes);
// --- Moderace (ADMIN/SUPERADMIN) ---
// (specifičtější cesty MUSÍ být před "/:id")
router.get("/pending/list", auth_1.authenticateToken, (0, auth_1.requireRole)("ADMIN", "SUPERADMIN"), recipeController_1.getPendingRecipes);
router.patch("/:id/approve", auth_1.authenticateToken, (0, auth_1.requireRole)("ADMIN", "SUPERADMIN"), recipeController_1.approveRecipe);
router.patch("/:id/reject", auth_1.authenticateToken, (0, auth_1.requireRole)("ADMIN", "SUPERADMIN"), recipeController_1.rejectRecipe);
// --- Veřejný detail ---
// Volitelný token: veřejnost uvidí jen APPROVED, admin/autor uvidí i PENDING/REJECTED
router.get("/:id", auth_1.authenticateTokenOptional, recipeController_1.getRecipeById);
// --- Podání návrhu receptu (přihlášený uživatel) ---
router.post("/submit", auth_1.authenticateToken, upload.single("image"), recipeController_1.submitRecipe);
// --- Admin CRUD (ADMIN/SUPERADMIN) ---
router.post("/", auth_1.authenticateToken, (0, auth_1.requireRole)("ADMIN", "SUPERADMIN"), upload.single("image"), recipeController_1.addRecipe);
router.put("/:id", auth_1.authenticateToken, (0, auth_1.requireRole)("ADMIN", "SUPERADMIN"), upload.single("image"), recipeController_1.updateRecipe);
router.delete("/:id", auth_1.authenticateToken, (0, auth_1.requireRole)("ADMIN", "SUPERADMIN"), recipeController_1.deleteRecipe);
exports.default = router;
