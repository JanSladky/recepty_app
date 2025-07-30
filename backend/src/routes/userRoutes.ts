import { Router } from "express";
import { verifyUser } from "../middleware/auth";
import {
  loginUser,
  getMyFavorites,
  toggleFavorite,
  generateShoppingList,
  resetPassword, // ✅ nový import
} from "../controllers/userController";

const router = Router();

// ✅ Přihlášení uživatele
router.post("/login", loginUser);

// ✅ Reset hesla pro uživatele podle e-mailu
router.post("/reset-password", resetPassword); // ✅ nový endpoint

// ✅ Získá všechny oblíbené recepty přihlášeného uživatele
router.get("/favorites", verifyUser, getMyFavorites);

// ✅ Přidá nebo odebere recept z oblíbených (uživatel musí být přihlášen)
router.post("/favorites/:id", verifyUser, toggleFavorite);

// ✅ Vygeneruje nákupní seznam – ověřený uživatel
router.post("/shopping-list", verifyUser, generateShoppingList);

export default router;