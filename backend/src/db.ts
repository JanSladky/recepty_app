import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

// ✅ PostgreSQL připojení přes DATABASE_URL (Render, Railway apod.)
export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});
