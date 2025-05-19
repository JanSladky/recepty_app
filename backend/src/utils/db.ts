import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

// Lokální výchozí připojení pro vývoj
const localConnectionString = "postgres://recepty:recepty123@localhost:5432/recepty_dev";

// Produkční připojení z env proměnné
const connectionString = isProduction ? process.env.DATABASE_URL : localConnectionString;

const pool = new Pool({
  connectionString,
  ssl: isProduction ? { rejectUnauthorized: false } : undefined, // ❗ `undefined` místo false, aby lokální prostředí SSL vůbec neřešilo
});

// Jednoduchý wrapper pro dotazy a připojení
const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
  connect: () => pool.connect(),
};

export default db;
