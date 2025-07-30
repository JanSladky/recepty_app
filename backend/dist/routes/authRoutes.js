"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// 📝 Registrace nového uživatele
router.post("/register", async (req, res, next) => {
    try {
        await (0, authController_1.registerUser)(req, res);
    }
    catch (err) {
        next(err);
    }
});
// 🔐 Přihlášení uživatele
router.post("/login", async (req, res, next) => {
    try {
        await (0, authController_1.loginUser)(req, res);
    }
    catch (err) {
        next(err);
    }
});
// 👤 Získání informací o přihlášeném uživateli (ověřeno JWT tokenem)
router.get("/me", auth_1.verifyUser, async (req, res, next) => {
    try {
        await (0, authController_1.getUserByEmail)(req, res);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
