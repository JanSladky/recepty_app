"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const recipeController_1 = require("../controllers/recipeController");
const router = express_1.default.Router();
// --- ROUTY PRO SUROVINY ---
router.get("/", recipeController_1.getAllIngredients);
router.post("/", recipeController_1.createIngredient);
router.put("/:id", recipeController_1.updateIngredient);
router.delete("/:id", recipeController_1.deleteIngredient);
// --- ROUTY PRO KATEGORIE SUROVIN ---
router.get("/categories", recipeController_1.getAllCategories);
router.post("/categories", recipeController_1.createCategory);
router.put("/categories/:id", recipeController_1.updateCategory);
router.delete("/categories/:id", recipeController_1.deleteCategory);
exports.default = router;
