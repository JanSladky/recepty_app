import db from "../utils/db";

export type Ingredient = {
  id: number;
  name: string;
  calories_per_gram: number;
  category_id: number;
  category_name: string;
};

export type IngredientInput = {
  name: string;
  amount: number;
  unit: string;
};

// ✅ Ingredients
export async function getAllIngredientsFromDB(): Promise<Ingredient[]> {
  const res = await db.query(
    `SELECT i.id, i.name, i.calories_per_gram, i.category_id, c.name AS category_name
     FROM ingredients i
     LEFT JOIN ingredient_categories c ON i.category_id = c.id
     ORDER BY i.name ASC`
  );
  return res.rows;
}

export async function createIngredientInDB(name: string, calories: number, category_id: number): Promise<Ingredient> {
  const res = await db.query(
    `INSERT INTO ingredients (name, calories_per_gram, category_id)
     VALUES ($1, $2, $3) RETURNING id, name, calories_per_gram, category_id`,
    [name, calories, category_id]
  );
  const cat = await db.query("SELECT name FROM ingredient_categories WHERE id = $1", [category_id]);
  return { ...res.rows[0], category_name: cat.rows[0]?.name || "" };
}

export async function updateIngredientInDB(id: number, name: string, calories: number, category_id: number): Promise<void> {
  console.log("🛠️ UPDATE suroviny:", { id, name, calories, category_id });
  await db.query("UPDATE ingredients SET name = $1, calories_per_gram = $2, category_id = $3 WHERE id = $4", [name, calories, category_id, id]);
}

export async function deleteIngredientFromDB(id: number): Promise<void> {
  await db.query("DELETE FROM ingredients WHERE id = $1", [id]);
}

export async function getAllIngredientCategories(): Promise<{ id: number; name: string }[]> {
  const res = await db.query("SELECT id, name FROM ingredient_categories ORDER BY name ASC");
  return res.rows;
}

export async function createIngredientCategory(name: string): Promise<{ id: number; name: string }> {
  const res = await db.query("INSERT INTO ingredient_categories (name) VALUES ($1) RETURNING id, name", [name]);
  return res.rows[0];
}

export async function updateIngredientCategory(id: number, name: string): Promise<void> {
  await db.query("UPDATE ingredient_categories SET name = $1 WHERE id = $2", [name, id]);
}

export async function deleteIngredientCategory(id: number): Promise<void> {
  await db.query("DELETE FROM ingredient_categories WHERE id = $1", [id]);
}

// ✅ Recepty

export async function getAllRecipes(): Promise<any[]> {
  const res = await db.query("SELECT id, title, notes, image_url, steps, calories FROM recipes");
  const recipes = res.rows;

  for (const recipe of recipes) {
    const [catRes, mealRes] = await Promise.all([
      db.query("SELECT c.name FROM recipe_categories rc JOIN categories c ON rc.category_id = c.id WHERE rc.recipe_id = $1", [recipe.id]),
      db.query("SELECT m.name FROM recipe_meal_types rmt JOIN meal_types m ON rmt.meal_type_id = m.id WHERE rmt.recipe_id = $1", [recipe.id]),
    ]);

    recipe.categories = catRes.rows.map((r) => r.name);
    recipe.meal_types = mealRes.rows.map((r) => r.name);
  }

  return recipes;
}

export async function getRecipeByIdFromDB(id: number) {
  const res = await db.query("SELECT * FROM recipes WHERE id = $1", [id]);
  const recipe = res.rows[0];
  if (!recipe) return null;

  const [ingredients, categories, mealTypes] = await Promise.all([
    db.query("SELECT ri.amount, ri.unit, i.name FROM recipe_ingredients ri JOIN ingredients i ON ri.ingredient_id = i.id WHERE ri.recipe_id = $1", [id]),
    db.query("SELECT c.name FROM recipe_categories rc JOIN categories c ON rc.category_id = c.id WHERE rc.recipe_id = $1", [id]),
    db.query("SELECT m.name FROM recipe_meal_types rmt JOIN meal_types m ON rmt.meal_type_id = m.id WHERE rmt.recipe_id = $1", [id]),
  ]);

  return {
    ...recipe,
    steps: recipe.steps ?? [],
    ingredients: ingredients.rows,
    categories: categories.rows.map((r) => r.name),
    meal_types: mealTypes.rows.map((r) => r.name),
  };
}

export async function createFullRecipe(
  title: string,
  notes: string,
  imageUrl: string,
  mealTypes: string[],
  ingredients: IngredientInput[],
  categories: string[],
  steps: string[],
  calories: number | null
): Promise<number> {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `INSERT INTO recipes (title, notes, image_url, steps, calories)
       VALUES ($1, $2, $3, $4::jsonb, $5) RETURNING id`,
      [title, notes, imageUrl, JSON.stringify(steps), calories]
    );

    const recipeId = result.rows[0].id;

    await insertRelations(client, recipeId, mealTypes, ingredients, categories);
    await client.query("COMMIT");
    return recipeId;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function updateRecipeInDB(
  id: number,
  title: string,
  notes: string,
  imageUrl: string | null,
  mealTypes: string[],
  ingredients: IngredientInput[],
  categories: string[],
  steps: string[],
  calories: number | null
): Promise<void> {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `UPDATE recipes
       SET title = $1, notes = $2, image_url = $3, steps = $4::jsonb, calories = $5
       WHERE id = $6`,
      [title, notes, imageUrl, JSON.stringify(steps), calories, id]
    );

    await client.query("DELETE FROM recipe_ingredients WHERE recipe_id = $1", [id]);
    await client.query("DELETE FROM recipe_categories WHERE recipe_id = $1", [id]);
    await client.query("DELETE FROM recipe_meal_types WHERE recipe_id = $1", [id]);

    await insertRelations(client, id, mealTypes, ingredients, categories);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function deleteRecipeFromDB(id: number): Promise<void> {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM recipe_ingredients WHERE recipe_id = $1", [id]);
    await client.query("DELETE FROM recipe_categories WHERE recipe_id = $1", [id]);
    await client.query("DELETE FROM recipe_meal_types WHERE recipe_id = $1", [id]);
    await client.query("DELETE FROM recipes WHERE id = $1", [id]);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function insertRelations(client: any, recipeId: number, mealTypes: string[], ingredients: IngredientInput[], categories: string[]) {
  for (const ing of ingredients) {
    const res = await client.query("SELECT id FROM ingredients WHERE name = $1", [ing.name]);
    let ingredientId = res.rows[0]?.id;

    if (!ingredientId) {
      const insert = await client.query("INSERT INTO ingredients (name, calories_per_gram) VALUES ($1, $2) RETURNING id", [ing.name, 0]);
      ingredientId = insert.rows[0].id;
    }

    await client.query("INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount, unit) VALUES ($1, $2, $3, $4)", [
      recipeId,
      ingredientId,
      ing.amount,
      ing.unit,
    ]);
  }

  for (const cat of categories) {
    const res = await client.query("SELECT id FROM categories WHERE name = $1", [cat]);
    const categoryId = res.rows[0]?.id ?? (await client.query("INSERT INTO categories (name) VALUES ($1) RETURNING id", [cat])).rows[0].id;

    await client.query("INSERT INTO recipe_categories (recipe_id, category_id) VALUES ($1, $2)", [recipeId, categoryId]);
  }

  for (const meal of mealTypes) {
    const res = await client.query("SELECT id FROM meal_types WHERE name = $1", [meal]);
    const mealTypeId = res.rows[0]?.id ?? (await client.query("INSERT INTO meal_types (name) VALUES ($1) RETURNING id", [meal])).rows[0].id;

    await client.query("INSERT INTO recipe_meal_types (recipe_id, meal_type_id) VALUES ($1, $2)", [recipeId, mealTypeId]);
  }
}
