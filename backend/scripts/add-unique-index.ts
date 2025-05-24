// backend/scripts/add-unique-index.ts

import path from "path";
import dotenv from "dotenv";
import db from "../src/utils/db";

// ✅ Načti .env ze složky rootu projektu (../.env)
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function createUniqueIndex() {
  try {
    console.log("🌍 Připojení k DB:", process.env.DATABASE_URL);

    const result = await db.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes 
          WHERE tablename = 'ingredient_categories'
          AND indexname = 'ingredient_categories_name_key'
        ) THEN
          ALTER TABLE ingredient_categories ADD CONSTRAINT ingredient_categories_name_key UNIQUE (name);
        END IF;
      END
      $$;
    `);

    console.log("✅ Unikátní index byl vytvořen (nebo už existoval).");
  } catch (err) {
    console.error("❌ Chyba při vytváření indexu:", err);
  } finally {
    process.exit();
  }
}

createUniqueIndex();