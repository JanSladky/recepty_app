import { db } from "./db";

export async function initDatabase() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS recipes (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        image_url TEXT
      );

      CREATE TABLE IF NOT EXISTS ingredients (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS recipe_ingredients (
        recipe_id INTEGER REFERENCES recipes(id),
        ingredient_id INTEGER REFERENCES ingredients(id),
        amount FLOAT,
        unit TEXT
      );

      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS recipe_categories (
        recipe_id INTEGER REFERENCES recipes(id),
        category_id INTEGER REFERENCES categories(id)
      );

      CREATE TABLE IF NOT EXISTS meal_types (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS recipe_meal_types (
        recipe_id INTEGER REFERENCES recipes(id),
        meal_type_id INTEGER REFERENCES meal_types(id)
      );
    `);

    console.log("✅ Tabulky byly vytvořeny.");
  } catch (error) {
    console.error("❌ Chyba při vytváření tabulek:", error);
  } finally {
    await db.end();
  }
}

initDatabase();