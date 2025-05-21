import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

const connectionString = process.env.DATABASE_URL || "postgres://recepty:recepty123@localhost:5432/recepty_dev";

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes("railway") ? { rejectUnauthorized: false } : undefined,
});

const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
  connect: () => pool.connect(),
};

export default db;