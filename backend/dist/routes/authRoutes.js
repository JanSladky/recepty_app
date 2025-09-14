"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * POST /api/auth/register
 * Registrace nového uživatele
 */
router.post("/register", authController_1.registerUser);
/**
 * POST /api/auth/login
 * Přihlášení – vrací token a uživatele bez hesla
 */
router.post("/login", authController_1.loginUser);
/**
 * GET /api/auth/me
 * Info o přihlášeném uživateli přímo z JWT (id, email, role)
 */
router.get("/me", auth_1.authenticateToken, (req, res) => {
    res.json(req.user);
});
exports.default = router;
