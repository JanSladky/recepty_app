// 📁 backend/src/routes/userRoutes.ts
import express from "express";
import { loginUser, resetPassword, getMyFavorites, toggleFavorite, generateShoppingList, generateShoppingListFromPlan } from "../controllers/userController";
import { authenticateToken } from "../middleware/auth";
import { getUserByEmail } from "../controllers/userController";
import { updateAvatar } from "../controllers/userController";
import upload from "../middleware/upload";
import { verifyUser } from "../middleware/auth";

const router = express.Router();

// ✅ Přihlášení
router.post("/login", loginUser);
router.post("/upload-avatar", verifyUser, upload.single("avatar"), updateAvatar);

// ✅ Reset hesla
router.post("/reset-password", resetPassword);

// ✅ Načti oblíbené recepty přihlášeného uživatele
router.get("/favorites", authenticateToken, getMyFavorites);

// ✅ Přepnout oblíbený recept (přidat nebo odebrat)
router.post("/favorites/:id/toggle", authenticateToken, toggleFavorite);

// ✅ Vygeneruj nákupní seznam z oblíbených receptů
router.get("/favorites/shopping-list", authenticateToken, generateShoppingList);

router.post("/shopping-list", authenticateToken, generateShoppingListFromPlan);
// 🧩 přidej sem route
router.get("/email", getUserByEmail);

export default router;
