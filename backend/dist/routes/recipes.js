"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const cloudinary_1 = require("../utils/cloudinary");
const recipeController_1 = require("../controllers/recipeController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// ✅ Správné vytvoření Multer instance
const upload = (0, multer_1.default)({ storage: cloudinary_1.storage });
// ✅ Veřejné GET routy
router.get("/", recipeController_1.getRecipes);
router.get("/ingredients", recipeController_1.getAllIngredients);
router.get("/:id", recipeController_1.getRecipeById);
// ✅ Admin pouze pro POST/PUT/DELETE
router.post("/", auth_1.verifyAdmin, upload.single("image"), recipeController_1.addFullRecipe);
router.put("/:id", auth_1.verifyAdmin, upload.single("image"), recipeController_1.updateRecipe);
router.delete("/:id", auth_1.verifyAdmin, recipeController_1.deleteRecipe);
exports.default = router;
