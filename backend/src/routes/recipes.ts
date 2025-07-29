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
import { verifyAdmin } from "../middleware/auth";

const router = Router();

// Správné vytvoření Multer instance
const upload = multer({ storage });

// --- Veřejné GET routy (bez ověření) ---
router.get("/", getRecipes);
router.get("/:id", getRecipeById);

// --- Routy chráněné pro administrátory ---

// FINÁLNÍ OPRAVA: Middleware 'upload' musí být PŘED 'verifyAdmin'.
// Tím zajistíme, že 'req.body' bude existovat, když ho 'verifyAdmin' bude číst.
router.post("/", upload.single("image"), verifyAdmin, addRecipe);
router.put("/:id", upload.single("image"), verifyAdmin, updateRecipe);

// U mazání obrázek není, takže pořadí je jedno, ale pro konzistenci ho necháme.
router.delete("/:id", verifyAdmin, deleteRecipe);

export default router;