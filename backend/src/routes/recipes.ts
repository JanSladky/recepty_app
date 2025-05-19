import express from "express";
import multer from "multer";
import path from "path";
import { storage } from "../utils/cloudinary";
import { getRecipes, getRecipeById, addFullRecipe, updateRecipe, deleteRecipe } from "../controllers/recipeController";
import { verifyAdmin } from "../middleware/auth";

const router = express.Router();

// ✅ Nastavení Multer + Cloudinary storage
const upload = multer({ storage });

// 📘 ROUTES

// Veřejné GET
router.get("/", getRecipes); // seznam všech receptů
router.get("/:id", getRecipeById); // detail jednoho receptu

// ✅ Chráněné admin routy s ověřením + uploadem obrázku
router.post("/", verifyAdmin, upload.single("image"), addFullRecipe);
router.put("/:id", verifyAdmin, upload.single("image"), updateRecipe);
router.delete("/:id", verifyAdmin, deleteRecipe);

export default router;
