// src/routes/favoriteRoutes.ts
import express from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import {
  getMyFavorites,
  toggleFavorite,
  generateShoppingList,
} from "../controllers/userController";

const router = express.Router();

router.get("/favorites", authenticateToken, getMyFavorites);
router.post("/favorites/:id", authenticateToken, toggleFavorite);
router.get("/favorites/shopping-list", authenticateToken, generateShoppingList);

export default router;