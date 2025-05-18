import express from "express";
import multer from "multer";
import { storage } from "../utils/cloudinary";
import path from "path";
import { getRecipes, getRecipeById, addFullRecipe, updateRecipe, deleteRecipe } from "../controllers/recipeController";
import { verifyAdmin } from "../middleware/auth";

const router = express.Router();
const upload = multer({ storage }); // ✅ používáme storage z cloudinary

// ❌ Duplikovaná deklarace storage byla odstraněna

// API routy
router.get("/", getRecipes);
router.get("/:id", getRecipeById);
router.post("/", verifyAdmin, upload.single("image"), addFullRecipe);
router.put("/:id", verifyAdmin, upload.single("image"), updateRecipe);
router.delete("/:id", verifyAdmin, deleteRecipe);

export default router;
