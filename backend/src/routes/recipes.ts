import { Router } from "express";
import multer from "multer";
import { storage } from "../utils/cloudinary";
import { authenticateToken, verifyAdmin } from "../middleware/auth";
import {
  getRecipes,
  getRecipeById,
  addRecipe,
  updateRecipe,
  deleteRecipe,
} from "../controllers/recipeController";

const router = Router();

// Správné vytvoření Multer instance
const upload = multer({ storage });

// --- Veřejné GET routy (bez ověření) ---
router.get("/", getRecipes);
router.get("/:id", getRecipeById);

// --- Routy chráněné pro administrátory ---
// ✅ SPRÁVNÉ POŘADÍ: nejdřív ověřit token → pak admina → pak nahrát obrazek

router.post("/", authenticateToken, verifyAdmin, upload.single("image"), addRecipe);
router.put("/:id", authenticateToken, verifyAdmin, upload.single("image"), updateRecipe);
router.delete("/:id", authenticateToken, verifyAdmin, deleteRecipe);

export default router;