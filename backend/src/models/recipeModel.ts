import { db } from "../db";
import { ResultSetHeader, RowDataPacket } from "mysql2";

export type IngredientInput = {
  name: string;
  amount: number;
  unit: string;
};

export async function getAllRecipes(): Promise<any[]> {
  const [recipeRows] = await db.query("SELECT id, title, description, image_url FROM recipes");

  const recipesWithRelations = await Promise.all(
    (recipeRows as RowDataPacket[]).map(async (recipe) => {
      const [categoryRows] = await db.query("SELECT c.name FROM recipe_categories rc JOIN categories c ON rc.category_id = c.id WHERE rc.recipe_id = ?", [recipe.id]);
      const [mealTypeRows] = await db.query("SELECT m.name FROM recipe_meal_types rmt JOIN meal_types m ON rmt.meal_type_id = m.id WHERE rmt.recipe_id = ?", [recipe.id]);

      return {
        ...recipe,
        categories: (categoryRows as RowDataPacket[]).map((c) => c.name),
        meal_types: (mealTypeRows as RowDataPacket[]).map((m) => m.name),
      };
    })
  );

  return recipesWithRelations;
}

export async function getRecipeByIdFromDB(id: number) {
  const [recipeRows] = await db.query("SELECT id, title, description, image_url FROM recipes WHERE id = ?", [id]);
  const recipe = (recipeRows as RowDataPacket[])[0];
  if (!recipe) return null;

  const [ingredients] = await db.query("SELECT ri.amount, ri.unit, i.name FROM recipe_ingredients ri JOIN ingredients i ON ri.ingredient_id = i.id WHERE ri.recipe_id = ?", [id]);
  const [categories] = await db.query("SELECT c.name FROM recipe_categories rc JOIN categories c ON rc.category_id = c.id WHERE rc.recipe_id = ?", [id]);
  const [mealTypes] = await db.query("SELECT m.name FROM recipe_meal_types rmt JOIN meal_types m ON rmt.meal_type_id = m.id WHERE rmt.recipe_id = ?", [id]);

  return {
    ...recipe,
    ingredients: ingredients as IngredientInput[],
    categories: (categories as RowDataPacket[]).map((c) => c.name),
    meal_types: (mealTypes as RowDataPacket[]).map((m) => m.name),
  };
}

export async function createFullRecipe(
  title: string,
  description: string,
  imageUrl: string,
  mealTypes: string[],
  ingredients: IngredientInput[],
  categories: string[]
): Promise<number> {
  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    const [recipeResult] = await conn.query("INSERT INTO recipes (title, description, image_url) VALUES (?, ?, ?)", [title, description, imageUrl]);
    const recipeId = (recipeResult as ResultSetHeader).insertId;

    for (const ing of ingredients) {
      const [existingRows] = await conn.query("SELECT id FROM ingredients WHERE name = ?", [ing.name]);
      let ingredientId = (existingRows as RowDataPacket[])[0]?.id;

      if (!ingredientId) {
        const [res] = await conn.query("INSERT INTO ingredients (name) VALUES (?)", [ing.name]);
        ingredientId = (res as ResultSetHeader).insertId;
      }

      await conn.query("INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount, unit) VALUES (?, ?, ?, ?)", [
        recipeId, ingredientId, ing.amount, ing.unit
      ]);
    }

    for (const cat of categories) {
      const [existingRows] = await conn.query("SELECT id FROM categories WHERE name = ?", [cat]);
      let categoryId = (existingRows as RowDataPacket[])[0]?.id;

      if (!categoryId) {
        const [res] = await conn.query("INSERT INTO categories (name) VALUES (?)", [cat]);
        categoryId = (res as ResultSetHeader).insertId;
      }

      await conn.query("INSERT INTO recipe_categories (recipe_id, category_id) VALUES (?, ?)", [recipeId, categoryId]);
    }

    for (const meal of mealTypes) {
      const [existingRows] = await conn.query("SELECT id FROM meal_types WHERE name = ?", [meal]);
      let mealTypeId = (existingRows as RowDataPacket[])[0]?.id;

      if (!mealTypeId) {
        const [res] = await conn.query("INSERT INTO meal_types (name) VALUES (?)", [meal]);
        mealTypeId = (res as ResultSetHeader).insertId;
      }

      await conn.query("INSERT INTO recipe_meal_types (recipe_id, meal_type_id) VALUES (?, ?)", [recipeId, mealTypeId]);
    }

    await conn.commit();
    conn.release();
    return recipeId;
  } catch (error) {
    await conn.rollback();
    conn.release();
    throw error;
  }
}

export async function updateRecipeInDB(
  id: number,
  title: string,
  description: string,
  imageUrl: string | null,
  mealTypes: string[],
  ingredients: IngredientInput[],
  categories: string[]
): Promise<void> {
  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    await conn.query("UPDATE recipes SET title = ?, description = ?, image_url = ? WHERE id = ?", [title, description, imageUrl, id]);

    await conn.query("DELETE FROM recipe_ingredients WHERE recipe_id = ?", [id]);
    await conn.query("DELETE FROM recipe_categories WHERE recipe_id = ?", [id]);
    await conn.query("DELETE FROM recipe_meal_types WHERE recipe_id = ?", [id]);

    for (const ing of ingredients) {
      const [existingRows] = await conn.query("SELECT id FROM ingredients WHERE name = ?", [ing.name]);
      let ingredientId = (existingRows as RowDataPacket[])[0]?.id;

      if (!ingredientId) {
        const [res] = await conn.query("INSERT INTO ingredients (name) VALUES (?)", [ing.name]);
        ingredientId = (res as ResultSetHeader).insertId;
      }

      await conn.query("INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount, unit) VALUES (?, ?, ?, ?)", [
        id, ingredientId, ing.amount, ing.unit
      ]);
    }

    for (const cat of categories) {
      const [existingRows] = await conn.query("SELECT id FROM categories WHERE name = ?", [cat]);
      let categoryId = (existingRows as RowDataPacket[])[0]?.id;

      if (!categoryId) {
        const [res] = await conn.query("INSERT INTO categories (name) VALUES (?)", [cat]);
        categoryId = (res as ResultSetHeader).insertId;
      }

      await conn.query("INSERT INTO recipe_categories (recipe_id, category_id) VALUES (?, ?)", [id, categoryId]);
    }

    for (const meal of mealTypes) {
      const [existingRows] = await conn.query("SELECT id FROM meal_types WHERE name = ?", [meal]);
      let mealTypeId = (existingRows as RowDataPacket[])[0]?.id;

      if (!mealTypeId) {
        const [res] = await conn.query("INSERT INTO meal_types (name) VALUES (?)", [meal]);
        mealTypeId = (res as ResultSetHeader).insertId;
      }

      await conn.query("INSERT INTO recipe_meal_types (recipe_id, meal_type_id) VALUES (?, ?)", [id, mealTypeId]);
    }

    await conn.commit();
    conn.release();
  } catch (error) {
    await conn.rollback();
    conn.release();
    throw error;
  }
}

export async function deleteRecipeFromDB(id: number): Promise<void> {
  const conn = await db.getConnection();
  await conn.beginTransaction();
  try {
    await conn.query("DELETE FROM recipe_ingredients WHERE recipe_id = ?", [id]);
    await conn.query("DELETE FROM recipe_categories WHERE recipe_id = ?", [id]);
    await conn.query("DELETE FROM recipe_meal_types WHERE recipe_id = ?", [id]);
    await conn.query("DELETE FROM recipes WHERE id = ?", [id]);
    await conn.commit();
    conn.release();
  } catch (error) {
    await conn.rollback();
    conn.release();
    throw error;
  }
}