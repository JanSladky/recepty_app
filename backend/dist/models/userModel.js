"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserByEmailFromDB = void 0;
const db_1 = __importDefault(require("../utils/db")); // Ujisti se, že tento import odpovídá tvému připojení k databázi
/**
 * Vrátí uživatele podle e-mailu z databáze.
 * @param email E-mail uživatele
 * @returns Objekt uživatele nebo undefined
 */
const getUserByEmailFromDB = async (email) => {
    const result = await db_1.default.query("SELECT * FROM users WHERE email = $1", [email]);
    return result.rows[0]; // vrátí undefined, pokud nenalezen
};
exports.getUserByEmailFromDB = getUserByEmailFromDB;
