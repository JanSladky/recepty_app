// 📁 src/routes/favoriteRoutes.ts
import express from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import { getMyFavorites, toggleFavorite, generateShoppingList } from "../controllers/userController"; // zůstává, pokud vše řešíš v tomto controlleru

const router = express.Router();

// ✅ Vrátí všechny recepty, které má přihlášený uživatel ve "favorites"
router.get("/", authenticateToken, getMyFavorites);

// ✅ Přidá nebo odebere recept (dle toho, jestli už v oblíbených je)
router.post("/:id", authenticateToken, toggleFavorite);

// ✅ Vrátí nákupní seznam podle aktuálních "favorites" receptů
router.get("/shopping-list", authenticateToken, generateShoppingList);

export default router;
