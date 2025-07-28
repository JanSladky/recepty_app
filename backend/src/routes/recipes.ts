import { Router } from "express";
import multer from "multer";
import { storage } from "../utils/cloudinary";
import {
  getRecipes,
  getRecipeById,
  addRecipe,        // <-- ZMĚNA ZDE (původně addFullRecipe)
  updateRecipe,
  deleteRecipe,
} from "../controllers/recipeController";
// Poznámka: getAllIngredients se přesunulo do vlastního routeru pro suroviny
import { verifyAdmin } from "../middleware/auth";

const router = Router();

// ✅ Správné vytvoření Multer instance
const upload = multer({ storage });

// ✅ Veřejné GET routy
router.get("/", getRecipes);
router.get("/:id", getRecipeById);

// ✅ Admin pouze pro POST/PUT/DELETE
// Používáme opravený název funkce 'addRecipe'
router.post("/", verifyAdmin, upload.single("image"), addRecipe); // <-- ZMĚNA ZDE
router.put("/:id", verifyAdmin, upload.single("image"), updateRecipe);
router.delete("/:id", verifyAdmin, deleteRecipe);

export default router;