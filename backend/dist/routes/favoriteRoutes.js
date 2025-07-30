"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/favoriteRoutes.ts
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const userController_1 = require("../controllers/userController");
const router = express_1.default.Router();
router.get("/favorites", authMiddleware_1.authenticateToken, userController_1.getMyFavorites);
router.post("/favorites/:id", authMiddleware_1.authenticateToken, userController_1.toggleFavorite);
router.get("/favorites/shopping-list", authMiddleware_1.authenticateToken, userController_1.generateShoppingList);
exports.default = router;
