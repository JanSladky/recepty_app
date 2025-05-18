import express from "express";
import multer from "multer";
import { storage } from "../utils/cloudinary";
import path from "path";
import { getRecipes, getRecipeById, addFullRecipe, updateRecipe, deleteRecipe } from "../controllers/recipeController";

const router = express.Router();
const upload = multer({ storage }); // ✅ používáme storage z cloudinary

// ❌ Duplikovaná deklarace storage byla odstraněna

// API routy
router.get("/", getRecipes);
router.get("/:id", getRecipeById);
router.post("/", upload.single("image"), addFullRecipe);
router.put("/:id", upload.single("image"), updateRecipe);
router.delete("/:id", deleteRecipe);

export default router;
