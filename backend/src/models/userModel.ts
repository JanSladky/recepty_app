// backend/src/models/userModel.ts
import pool from "../utils/db";

export type Role = 'SUPERADMIN' | 'ADMIN' | 'USER';

export interface DbUserRow {
  id: string;
  email: string;
  password_hash: string;
  avatar_url: string | null;
  role: Role;
  created_at?: Date; // necháme volitelné, kdyby ve schématu nebylo
}

export type User = Omit<DbUserRow, 'password_hash'>;

const mapRowToUser = (row: DbUserRow): User => ({
  id: row.id,
  email: row.email,
  avatar_url: row.avatar_url,
  role: row.role,
  created_at: row.created_at,
});

/**
 * Najdi uživatele podle e-mailu (včetně password_hash pro login).
 */
export const getUserByEmailFromDB = async (email: string): Promise<DbUserRow | undefined> => {
  const { rows } = await pool.query("SELECT * FROM users WHERE email = $1 LIMIT 1", [email]);
  return rows[0] as DbUserRow | undefined;
};

/**
 * Najdi uživatele podle ID (bez hesla).
 */
export const getUserById = async (id: string): Promise<User | undefined> => {
  const { rows } = await pool.query("SELECT * FROM users WHERE id = $1 LIMIT 1", [id]);
  const row = rows[0] as DbUserRow | undefined;
  return row ? mapRowToUser(row) : undefined;
};

/**
 * Vytvoř uživatele – default role USER (pokud nepředáš jinou).
 */
export const createUser = async (params: {
  email: string;
  passwordHash: string;
  avatarUrl?: string | null;
  role?: Role;
}): Promise<User> => {
  const role = params.role ?? 'USER';
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash, avatar_url, role)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [params.email, params.passwordHash, params.avatarUrl ?? null, role]
  );
  return mapRowToUser(rows[0] as DbUserRow);
};

/**
 * Vylistuj uživatele (pro admin UI).
 */
export const listUsers = async (limit = 50, offset = 0): Promise<User[]> => {
  const { rows } = await pool.query(
    `SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return (rows as DbUserRow[]).map(mapRowToUser);
};

/**
 * Pomocná – je uživatel superadmin?
 */
export const isUserSuperadmin = async (userId: string): Promise<boolean> => {
  const { rows } = await pool.query(
    `SELECT role FROM users WHERE id = $1`,
    [userId]
  );
  const row = rows[0] as { role: Role } | undefined;
  return row?.role === 'SUPERADMIN';
};

/**
 * Změň roli uživatele (kontrolu opravnění dělej v controlleru – jen SUPERADMIN).
 * Obsahuje pojistku: nenechá odebrat roli poslednímu SUPERADMINovi.
 */
export const updateUserRole = async (userId: string, newRole: Role): Promise<User | undefined> => {
  if (newRole !== 'SUPERADMIN') {
    const countRes = await pool.query(`SELECT COUNT(*)::int AS count FROM users WHERE role = 'SUPERADMIN'`);
    const superadmins = Number((countRes.rows[0] as any).count);
    const targetIsSA = await isUserSuperadmin(userId);
    if (targetIsSA && superadmins <= 1) {
      throw new Error('Nelze odebrat roli poslednímu SUPERADMINovi.');
    }
  }

  const { rows } = await pool.query(
    `UPDATE users SET role = $2 WHERE id = $1 RETURNING *`,
    [userId, newRole]
  );
  const row = rows[0] as DbUserRow | undefined;
  return row ? mapRowToUser(row) : undefined;
};