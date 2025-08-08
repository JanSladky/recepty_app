// 📁 backend/src/routes/userRoutes.ts
import express from "express";
import {
  loginUser,
  resetPassword,
  getMyFavorites,
  toggleFavorite,
  generateShoppingList,
  generateShoppingListFromPlan,
  getUserByEmail,
  updateAvatar
} from "../controllers/userController";
import { authenticateToken, verifyUser } from "../middleware/auth";
import upload from "../middleware/upload";

const router = express.Router();

// ✅ Přihlášení
router.post("/login", loginUser);

// ✅ Nahrání / změna avataru
router.post("/upload-avatar", verifyUser, upload.single("avatar"), updateAvatar);

// ✅ Reset hesla
router.post("/reset-password", resetPassword);

// ✅ Načti oblíbené recepty přihlášeného uživatele
router.get("/favorites", authenticateToken, getMyFavorites);

// ✅ Přepnout oblíbený recept (přidat nebo odebrat)
router.post("/favorites/:id/toggle", authenticateToken, toggleFavorite);

// ✅ Vygeneruj nákupní seznam z oblíbených receptů
router.get("/favorites/shopping-list", authenticateToken, generateShoppingList);

// ✅ Nákupní seznam z plánu
router.post("/shopping-list", authenticateToken, generateShoppingListFromPlan);

// ✅ Získání uživatele podle emailu (pro useAdmin hook)
router.get("/email", authenticateToken, getUserByEmail);

export default router;