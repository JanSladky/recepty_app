import { Router } from "express";
import { registerUser, loginUser } from "../controllers/authController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

/**
 * POST /api/auth/register
 * Registrace nového uživatele
 */
router.post("/register", registerUser);

/**
 * POST /api/auth/login
 * Přihlášení – vrací token a uživatele bez hesla
 */
router.post("/login", loginUser);

/**
 * GET /api/auth/me
 * Info o přihlášeném uživateli přímo z JWT (id, email, role)
 */
router.get("/me", authenticateToken, (req, res) => {
  res.json(req.user);
});

export default router;