import { Router } from "express";
import multer from "multer";
import { storage } from "../utils/cloudinary";
import {
  getRecipes,
  getRecipeById,
  addRecipe,
  updateRecipe,
  deleteRecipe,
} from "../controllers/recipeController";
import { verifyAdmin } from "../middleware/auth"; // Tento import zůstává pro mazání

const router = Router();

const upload = multer({ storage });

// --- Veřejné GET routy (beze změny) ---
router.get("/", getRecipes);
router.get("/:id", getRecipeById);

// --- Routy chráněné pro administrátory ---

// ZDE JE ZMĚNA: 'verifyAdmin' je ODSTRANĚNO z cest pro přidání a úpravu.
// Ověření jsme přesunuli přímo do controlleru, aby se předešlo chybám.
router.post("/", upload.single("image"), addRecipe);
router.put("/:id", upload.single("image"), updateRecipe);

// 'verifyAdmin' zde ZŮSTÁVÁ, protože mazání nepoužívá obrázky a funguje správně.
router.delete("/:id", verifyAdmin, deleteRecipe);

export default router;
