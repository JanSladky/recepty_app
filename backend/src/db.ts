import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

const connectionString = isProduction
  ? process.env.DATABASE_URL
  : "postgres://recepty:recepty123@localhost:5432/recepty_dev";

export const db = new Pool({
  connectionString,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});