"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const recipeController_1 = require("../controllers/recipeController");
const router = express_1.default.Router();
// --- ROUTY PRO SUROVINY ---
router.get("/", recipeController_1.getAllIngredients);
router.get("/search", recipeController_1.searchLocalIngredients); // <<< TADY je nový endpoint
router.post("/", auth_1.authenticateToken, (0, auth_1.requireRole)("ADMIN", "SUPERADMIN"), recipeController_1.createIngredient);
router.put("/:id", auth_1.authenticateToken, (0, auth_1.requireRole)("ADMIN", "SUPERADMIN"), recipeController_1.updateIngredient);
router.delete("/:id", auth_1.authenticateToken, (0, auth_1.requireRole)("ADMIN", "SUPERADMIN"), recipeController_1.deleteIngredient);
// --- ROUTY PRO KATEGORIE SUROVIN ---
router.get("/categories", recipeController_1.getAllCategories);
router.post("/categories", auth_1.authenticateToken, (0, auth_1.requireRole)("ADMIN", "SUPERADMIN"), recipeController_1.createCategory);
router.put("/categories/:id", auth_1.authenticateToken, (0, auth_1.requireRole)("ADMIN", "SUPERADMIN"), recipeController_1.updateCategory);
router.delete("/categories/:id", auth_1.authenticateToken, (0, auth_1.requireRole)("ADMIN", "SUPERADMIN"), recipeController_1.deleteCategory);
exports.default = router;
