import express from "express";
import { authenticateToken, verifyAdmin } from "../middleware/auth";
import {
  // Controllery pro suroviny
  getAllIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,

  // Controllery pro kategorie - zde byly chyby v názvech
  getAllCategories, // Původně: getAllIngredientCategories
  createCategory, // Původně: createIngredientCategory
  updateCategory, // Původně: updateIngredientCategory
  deleteCategory, // Původně: deleteIngredientCategory
} from "../controllers/recipeController";

const router = express.Router();

// --- ROUTY PRO SUROVINY ---
router.get("/", getAllIngredients);
router.post("/", authenticateToken, verifyAdmin, createIngredient);
router.put("/:id", authenticateToken, verifyAdmin, updateIngredient);
router.delete("/:id", authenticateToken, verifyAdmin, deleteIngredient);

// --- ROUTY PRO KATEGORIE SUROVIN ---
router.get("/categories", getAllCategories);
router.post("/categories", authenticateToken, verifyAdmin, createCategory);
router.put("/categories/:id", authenticateToken, verifyAdmin, updateCategory);
router.delete("/categories/:id", authenticateToken, verifyAdmin, deleteCategory);

export default router;
