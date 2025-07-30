import pool from "../utils/db"; // Ujisti se, že tento import odpovídá tvému připojení k databázi

/**
 * Vrátí uživatele podle e-mailu z databáze.
 * @param email E-mail uživatele
 * @returns Objekt uživatele nebo undefined
 */
export const getUserByEmailFromDB = async (email: string) => {
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  return result.rows[0]; // vrátí undefined, pokud nenalezen
};