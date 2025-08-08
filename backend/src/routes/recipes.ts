// 📁 backend/src/routes/recipes.ts
import { Router } from "express";
import multer from "multer";
import { storage } from "../utils/cloudinary";
import { authenticateToken, requireRole } from "../middleware/auth";
import {
  getRecipes,
  getRecipeById,
  addRecipe,
  updateRecipe,
  deleteRecipe,
} from "../controllers/recipeController";

const router = Router();

// Multer instance (Cloudinary storage)
const upload = multer({ storage });

// --- Veřejné GET routy (bez ověření) ---
router.get("/", getRecipes);
router.get("/:id", getRecipeById);

// --- Routy chráněné ---
// ADMIN i SUPERADMIN mají právo přidávat/upravovat/mazat recepty
router.post(
  "/",
  authenticateToken,
  requireRole("ADMIN", "SUPERADMIN"),
  upload.single("image"),
  addRecipe
);

router.put(
  "/:id",
  authenticateToken,
  requireRole("ADMIN", "SUPERADMIN"),
  upload.single("image"),
  updateRecipe
);

router.delete(
  "/:id",
  authenticateToken,
  requireRole("ADMIN", "SUPERADMIN"),
  deleteRecipe
);

export default router;