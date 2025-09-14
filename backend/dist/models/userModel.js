"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserRole = exports.isUserSuperadmin = exports.listUsers = exports.createUser = exports.getUserById = exports.getUserByEmailFromDB = void 0;
// backend/src/models/userModel.ts
const db_1 = __importDefault(require("../utils/db"));
const mapRowToUser = (row) => ({
    id: row.id,
    email: row.email,
    avatar_url: row.avatar_url,
    role: row.role,
    created_at: row.created_at,
});
/**
 * Najdi uživatele podle e-mailu (včetně password_hash pro login).
 */
const getUserByEmailFromDB = async (email) => {
    const { rows } = await db_1.default.query("SELECT * FROM users WHERE email = $1 LIMIT 1", [email]);
    return rows[0];
};
exports.getUserByEmailFromDB = getUserByEmailFromDB;
/**
 * Najdi uživatele podle ID (bez hesla).
 */
const getUserById = async (id) => {
    const { rows } = await db_1.default.query("SELECT * FROM users WHERE id = $1 LIMIT 1", [id]);
    const row = rows[0];
    return row ? mapRowToUser(row) : undefined;
};
exports.getUserById = getUserById;
/**
 * Vytvoř uživatele – default role USER (pokud nepředáš jinou).
 */
const createUser = async (params) => {
    const role = params.role ?? 'USER';
    const { rows } = await db_1.default.query(`INSERT INTO users (email, password_hash, avatar_url, role)
     VALUES ($1, $2, $3, $4)
     RETURNING *`, [params.email, params.passwordHash, params.avatarUrl ?? null, role]);
    return mapRowToUser(rows[0]);
};
exports.createUser = createUser;
/**
 * Vylistuj uživatele (pro admin UI).
 */
const listUsers = async (limit = 50, offset = 0) => {
    const { rows } = await db_1.default.query(`SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]);
    return rows.map(mapRowToUser);
};
exports.listUsers = listUsers;
/**
 * Pomocná – je uživatel superadmin?
 */
const isUserSuperadmin = async (userId) => {
    const { rows } = await db_1.default.query(`SELECT role FROM users WHERE id = $1`, [userId]);
    const row = rows[0];
    return row?.role === 'SUPERADMIN';
};
exports.isUserSuperadmin = isUserSuperadmin;
/**
 * Změň roli uživatele (kontrolu opravnění dělej v controlleru – jen SUPERADMIN).
 * Obsahuje pojistku: nenechá odebrat roli poslednímu SUPERADMINovi.
 */
const updateUserRole = async (userId, newRole) => {
    if (newRole !== 'SUPERADMIN') {
        const countRes = await db_1.default.query(`SELECT COUNT(*)::int AS count FROM users WHERE role = 'SUPERADMIN'`);
        const superadmins = Number(countRes.rows[0].count);
        const targetIsSA = await (0, exports.isUserSuperadmin)(userId);
        if (targetIsSA && superadmins <= 1) {
            throw new Error('Nelze odebrat roli poslednímu SUPERADMINovi.');
        }
    }
    const { rows } = await db_1.default.query(`UPDATE users SET role = $2 WHERE id = $1 RETURNING *`, [userId, newRole]);
    const row = rows[0];
    return row ? mapRowToUser(row) : undefined;
};
exports.updateUserRole = updateUserRole;
