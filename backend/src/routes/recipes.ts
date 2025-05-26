import { Router } from "express";
import multer from "multer";
import { storage } from "../utils/cloudinary";
import {
  getRecipes,
  getAllIngredients,
  getRecipeById,
  addFullRecipe,
  updateRecipe,
  deleteRecipe,
} from "../controllers/recipeController";
import { verifyAdmin } from "../middleware/auth";

const router = Router();

// ✅ Správné vytvoření Multer instance
const upload = multer({ storage });

// ✅ Veřejné GET routy
router.get("/", getRecipes);
router.get("/ingredients", getAllIngredients);
router.get("/:id", getRecipeById);

// ✅ Admin pouze pro POST/PUT/DELETE
router.post("/", verifyAdmin, upload.single("image"), addFullRecipe);
router.put("/:id", verifyAdmin, upload.single("image"), updateRecipe);
router.delete("/:id", verifyAdmin, deleteRecipe);

export default router;