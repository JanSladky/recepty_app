"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// 📁 src/routes/favoriteRoutes.ts
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const userController_1 = require("../controllers/userController"); // zůstává, pokud vše řešíš v tomto controlleru
const router = express_1.default.Router();
// ✅ Vrátí všechny recepty, které má přihlášený uživatel ve "favorites"
router.get("/", auth_1.authenticateToken, userController_1.getMyFavorites);
// ✅ Přidá nebo odebere recept (dle toho, jestli už v oblíbených je)
router.post("/:id", auth_1.authenticateToken, userController_1.toggleFavorite);
// ✅ Vrátí nákupní seznam podle aktuálních "favorites" receptů
router.get("/shopping-list", auth_1.authenticateToken, userController_1.generateShoppingList);
exports.default = router;
