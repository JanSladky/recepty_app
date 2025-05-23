// ✅ Umístění: backend/src/routes/recipes.ts

import { Router } from "express";
import multer from "multer";
import { storage } from "../utils/cloudinary";
import * as recipeController from "../controllers/recipeController";
import { verifyAdmin } from "../middleware/auth";

const router = Router();

// ✅ Správné vytvoření Multer instance
const upload = multer({ storage });

// ✅ Veřejné GET routy
router.get("/", recipeController.getRecipes);
router.get("/:id", recipeController.getRecipeById);

// ✅ Admin pouze pro POST/PUT/DELETE
router.post("/", verifyAdmin, upload.single("image"), recipeController.addFullRecipe);
router.put("/:id", verifyAdmin, upload.single("image"), recipeController.updateRecipe);
router.delete("/:id", verifyAdmin, recipeController.deleteRecipe);

export default router;
