import express from "express";
import {
  // Controllery pro suroviny
  getAllIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,

  // Controllery pro kategorie - zde byly chyby v názvech
  getAllCategories,      // Původně: getAllIngredientCategories
  createCategory,        // Původně: createIngredientCategory
  updateCategory,        // Původně: updateIngredientCategory
  deleteCategory         // Původně: deleteIngredientCategory
} from "../controllers/recipeController";

const router = express.Router();

// --- ROUTY PRO SUROVINY ---
router.get("/", getAllIngredients);
router.post("/", createIngredient);
router.put("/:id", updateIngredient);
router.delete("/:id", deleteIngredient);

// --- ROUTY PRO KATEGORIE SUROVIN ---
router.get("/categories", getAllCategories);
router.post("/categories", createCategory);
router.put("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);

export default router;