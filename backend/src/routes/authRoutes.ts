import { Router } from "express";
import { registerUser, loginUser, getUserByEmail } from "../controllers/authController";
import { verifyUser } from "../middleware/auth";

const router = Router();

// 📝 Registrace nového uživatele
router.post("/register", async (req, res, next) => {
  try {
    await registerUser(req, res);
  } catch (err) {
    next(err);
  }
});

// 🔐 Přihlášení uživatele
router.post("/login", async (req, res, next) => {
  try {
    await loginUser(req, res);
  } catch (err) {
    next(err);
  }
});

// 👤 Získání informací o přihlášeném uživateli (ověřeno JWT tokenem)
router.get("/me", verifyUser, async (req, res, next) => {
  try {
    await getUserByEmail(req, res);
  } catch (err) {
    next(err);
  }
});

export default router;