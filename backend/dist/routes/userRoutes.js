"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// 📁 backend/src/routes/userRoutes.ts
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const upload_1 = __importDefault(require("../middleware/upload"));
const router = express_1.default.Router();
// ✅ Přihlášení
router.post("/login", userController_1.loginUser);
// ✅ Nahrání / změna avataru
router.post("/upload-avatar", auth_1.verifyUser, upload_1.default.single("avatar"), userController_1.updateAvatar);
// ✅ Reset hesla
router.post("/reset-password", userController_1.resetPassword);
// ✅ Načti oblíbené recepty přihlášeného uživatele
router.get("/favorites", auth_1.authenticateToken, userController_1.getMyFavorites);
// ✅ Přepnout oblíbený recept (přidat nebo odebrat)
router.post("/favorites/:id/toggle", auth_1.authenticateToken, userController_1.toggleFavorite);
// ✅ Vygeneruj nákupní seznam z oblíbených receptů
router.get("/favorites/shopping-list", auth_1.authenticateToken, userController_1.generateShoppingList);
// ✅ Nákupní seznam z plánu
router.post("/shopping-list", auth_1.authenticateToken, userController_1.generateShoppingListFromPlan);
// ✅ Získání uživatele podle emailu (pro useAdmin hook)
router.get("/email", auth_1.authenticateToken, userController_1.getUserByEmail);
exports.default = router;
