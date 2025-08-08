// 📁 backend/src/routes/ingredients.ts
import express from "express";
import { authenticateToken, requireRole } from "../middleware/auth";
import {
  // Controllery pro suroviny
  getAllIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,

  // Controllery pro kategorie
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/recipeController";

const router = express.Router();

// --- ROUTY PRO SUROVINY ---
router.get("/", getAllIngredients);
router.post("/", authenticateToken, requireRole("ADMIN", "SUPERADMIN"), createIngredient);
router.put("/:id", authenticateToken, requireRole("ADMIN", "SUPERADMIN"), updateIngredient);
router.delete("/:id", authenticateToken, requireRole("ADMIN", "SUPERADMIN"), deleteIngredient);

// --- ROUTY PRO KATEGORIE SUROVIN ---
router.get("/categories", getAllCategories);
router.post("/categories", authenticateToken, requireRole("ADMIN", "SUPERADMIN"), createCategory);
router.put("/categories/:id", authenticateToken, requireRole("ADMIN", "SUPERADMIN"), updateCategory);
router.delete("/categories/:id", authenticateToken, requireRole("ADMIN", "SUPERADMIN"), deleteCategory);

export default router;