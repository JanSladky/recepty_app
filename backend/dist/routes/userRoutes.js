"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// 📁 backend/src/routes/userRoutes.ts
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const userController_2 = require("../controllers/userController");
const router = express_1.default.Router();
// ✅ Přihlášení
router.post("/login", userController_1.loginUser);
// ✅ Reset hesla
router.post("/reset-password", userController_1.resetPassword);
// ✅ Načti oblíbené recepty přihlášeného uživatele
router.get("/favorites", auth_1.authenticateToken, userController_1.getMyFavorites);
// ✅ Přepnout oblíbený recept (přidat nebo odebrat)
router.post("/favorites/:id/toggle", auth_1.authenticateToken, userController_1.toggleFavorite);
// ✅ Vygeneruj nákupní seznam z oblíbených receptů
router.get("/favorites/shopping-list", auth_1.authenticateToken, userController_1.generateShoppingList);
router.post("/shopping-list", auth_1.authenticateToken, userController_1.generateShoppingListFromPlan);
// 🧩 přidej sem route
router.get("/email", userController_2.getUserByEmail);
exports.default = router;
