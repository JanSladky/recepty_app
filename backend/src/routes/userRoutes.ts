import { Router } from "express";
import { verifyUser } from "../middleware/auth";
import { getMyFavorites, toggleFavorite, generateShoppingList } from "../controllers/userController";

const router = Router();

// Získá všechny oblíbené recepty přihlášeného uživatele
router.get("/favorites", verifyUser, getMyFavorites);

// Přidá nebo odebere recept z oblíbených
router.post("/favorites/:id", verifyUser, toggleFavorite);

// Vygeneruje nákupní seznam z vybraných receptů
router.post("/shopping-list", generateShoppingList);

export default router;