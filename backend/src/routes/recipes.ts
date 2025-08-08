// 📁 backend/src/routes/recipes.ts
import { Router } from "express";
import multer from "multer";
import { storage } from "../utils/cloudinary";
import { authenticateToken, requireRole, authenticateTokenOptional } from "../middleware/auth";

import {
  getRecipes,
  getRecipeById,
  addRecipe,
  updateRecipe,
  deleteRecipe,
  submitRecipe,
  getPendingRecipes,
  approveRecipe,
  rejectRecipe,
} from "../controllers/recipeController";

const router = Router();
const upload = multer({ storage });

// --- Veřejné GET seznam ---
router.get("/", getRecipes);

// --- Moderace (ADMIN/SUPERADMIN) ---
// (specifičtější cesty MUSÍ být před "/:id")
router.get("/pending/list", authenticateToken, requireRole("ADMIN", "SUPERADMIN"), getPendingRecipes);
router.patch("/:id/approve", authenticateToken, requireRole("ADMIN", "SUPERADMIN"), approveRecipe);
router.patch("/:id/reject", authenticateToken, requireRole("ADMIN", "SUPERADMIN"), rejectRecipe);

// --- Veřejný detail ---
// Volitelný token: veřejnost uvidí jen APPROVED, admin/autor uvidí i PENDING/REJECTED
router.get("/:id", authenticateTokenOptional, getRecipeById);

// --- Podání návrhu receptu (přihlášený uživatel) ---
router.post("/submit", authenticateToken, upload.single("image"), submitRecipe);

// --- Admin CRUD (ADMIN/SUPERADMIN) ---
router.post("/", authenticateToken, requireRole("ADMIN", "SUPERADMIN"), upload.single("image"), addRecipe);
router.put("/:id", authenticateToken, requireRole("ADMIN", "SUPERADMIN"), upload.single("image"), updateRecipe);
router.delete("/:id", authenticateToken, requireRole("ADMIN", "SUPERADMIN"), deleteRecipe);

export default router;