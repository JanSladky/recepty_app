import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function testConnection() {
  try {
    const res = await db.query("SELECT NOW()");
    console.log("✅ Připojeno k DB:", res.rows[0]);
  } catch (err) {
    console.error("❌ Chyba při připojení k DB:", err);
  } finally {
    await db.end();
  }
}

testConnection();