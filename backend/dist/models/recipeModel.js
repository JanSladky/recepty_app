"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllIngredientsFromDB = getAllIngredientsFromDB;
exports.createIngredientInDB = createIngredientInDB;
exports.updateIngredientInDB = updateIngredientInDB;
exports.deleteIngredientFromDB = deleteIngredientFromDB;
exports.getAllIngredientCategories = getAllIngredientCategories;
exports.createIngredientCategory = createIngredientCategory;
exports.updateIngredientCategory = updateIngredientCategory;
exports.deleteIngredientCategory = deleteIngredientCategory;
exports.getAllRecipes = getAllRecipes;
exports.getRecipeByIdFromDB = getRecipeByIdFromDB;
exports.createFullRecipe = createFullRecipe;
exports.updateRecipeInDB = updateRecipeInDB;
exports.deleteRecipeFromDB = deleteRecipeFromDB;
const db_1 = __importDefault(require("../utils/db"));
// ✅ Ingredients
async function getAllIngredientsFromDB() {
    const res = await db_1.default.query(`SELECT i.id, i.name, i.calories_per_gram, i.category_id, c.name AS category_name
     FROM ingredients i
     LEFT JOIN ingredient_categories c ON i.category_id = c.id
     ORDER BY i.name ASC`);
    return res.rows;
}
async function createIngredientInDB(name, calories, category_id) {
    const res = await db_1.default.query(`INSERT INTO ingredients (name, calories_per_gram, category_id)
     VALUES ($1, $2, $3) RETURNING id, name, calories_per_gram, category_id`, [name, calories, category_id]);
    const cat = await db_1.default.query("SELECT name FROM ingredient_categories WHERE id = $1", [category_id]);
    return { ...res.rows[0], category_name: cat.rows[0]?.name || "" };
}
async function updateIngredientInDB(id, name, calories, category_id) {
    await db_1.default.query("UPDATE ingredients SET name = $1, calories_per_gram = $2, category_id = $3 WHERE id = $4", [name, calories, category_id, id]);
}
async function deleteIngredientFromDB(id) {
    await db_1.default.query("DELETE FROM ingredients WHERE id = $1", [id]);
}
async function getAllIngredientCategories() {
    const res = await db_1.default.query("SELECT id, name FROM ingredient_categories ORDER BY name ASC");
    return res.rows;
}
async function createIngredientCategory(name) {
    const res = await db_1.default.query("INSERT INTO ingredient_categories (name) VALUES ($1) RETURNING id, name", [name]);
    return res.rows[0];
}
async function updateIngredientCategory(id, name) {
    await db_1.default.query("UPDATE ingredient_categories SET name = $1 WHERE id = $2", [name, id]);
}
async function deleteIngredientCategory(id) {
    await db_1.default.query("DELETE FROM ingredient_categories WHERE id = $1", [id]);
}
// ✅ Recepty
async function getAllRecipes() {
    const res = await db_1.default.query("SELECT id, title, notes, image_url, steps, calories FROM recipes");
    const recipes = res.rows;
    for (const recipe of recipes) {
        const [catRes, mealRes] = await Promise.all([
            db_1.default.query("SELECT c.name FROM recipe_categories rc JOIN categories c ON rc.category_id = c.id WHERE rc.recipe_id = $1", [recipe.id]),
            db_1.default.query("SELECT m.name FROM recipe_meal_types rmt JOIN meal_types m ON rmt.meal_type_id = m.id WHERE rmt.recipe_id = $1", [recipe.id]),
        ]);
        recipe.categories = catRes.rows.map((r) => r.name);
        recipe.meal_types = mealRes.rows.map((r) => r.name);
    }
    return recipes;
}
async function getRecipeByIdFromDB(id) {
    const res = await db_1.default.query("SELECT * FROM recipes WHERE id = $1", [id]);
    const recipe = res.rows[0];
    if (!recipe) {
        return null;
    }
    const [ingredients, categories, mealTypes] = await Promise.all([
        db_1.default.query(`
      SELECT ri.amount, 'g' as unit, i.name, i.calories_per_gram
      FROM recipe_ingredients ri
      JOIN ingredients i ON ri.ingredient_id = i.id
      WHERE ri.recipe_id = $1
    `, [id]),
        db_1.default.query("SELECT c.name FROM recipe_categories rc JOIN categories c ON rc.category_id = c.id WHERE rc.recipe_id = $1", [id]),
        db_1.default.query("SELECT m.name FROM recipe_meal_types rmt JOIN meal_types m ON rmt.meal_type_id = m.id WHERE rmt.recipe_id = $1", [id]),
    ]);
    // ✅ Deduplikace a formátování meal_types
    const uniqueMealTypes = Array.from(new Map(mealTypes.rows.map((r) => {
        const cleaned = r.name.trim();
        return [cleaned.toLowerCase(), cleaned.charAt(0).toUpperCase() + cleaned.slice(1)];
    })).values());
    return {
        ...recipe,
        steps: recipe.steps ?? [],
        ingredients: ingredients.rows,
        categories: categories.rows.map((r) => r.name),
        meal_types: uniqueMealTypes,
    };
}
async function createFullRecipe(title, notes, imageUrl, mealTypes, ingredients, categories, steps, calories) {
    const client = await db_1.default.connect();
    try {
        await client.query("BEGIN");
        const result = await client.query(`INSERT INTO recipes (title, notes, image_url, steps, calories)
       VALUES ($1, $2, $3, $4::jsonb, $5) RETURNING id`, [title, notes, imageUrl, JSON.stringify(steps), calories]);
        const recipeId = result.rows[0].id;
        await insertRelations(client, recipeId, mealTypes, ingredients, categories);
        await client.query("COMMIT");
        return recipeId;
    }
    catch (err) {
        await client.query("ROLLBACK");
        throw err;
    }
    finally {
        client.release();
    }
}
async function updateRecipeInDB(id, title, notes, imageUrl, mealTypes, ingredients, categories, steps, calories) {
    const client = await db_1.default.connect();
    try {
        await client.query("BEGIN");
        await client.query(`UPDATE recipes
       SET title = $1, notes = $2, image_url = $3, steps = $4::jsonb, calories = $5
       WHERE id = $6`, [title, notes, imageUrl, JSON.stringify(steps), calories, id]);
        await client.query("DELETE FROM recipe_ingredients WHERE recipe_id = $1", [id]);
        await client.query("DELETE FROM recipe_categories WHERE recipe_id = $1", [id]);
        await client.query("DELETE FROM recipe_meal_types WHERE recipe_id = $1", [id]);
        await insertRelations(client, id, mealTypes, ingredients, categories);
        await client.query("COMMIT");
    }
    catch (err) {
        await client.query("ROLLBACK");
        throw err;
    }
    finally {
        client.release();
    }
}
async function deleteRecipeFromDB(id) {
    const client = await db_1.default.connect();
    try {
        await client.query("BEGIN");
        await client.query("DELETE FROM recipe_ingredients WHERE recipe_id = $1", [id]);
        await client.query("DELETE FROM recipe_categories WHERE recipe_id = $1", [id]);
        await client.query("DELETE FROM recipe_meal_types WHERE recipe_id = $1", [id]);
        await client.query("DELETE FROM recipes WHERE id = $1", [id]);
        await client.query("COMMIT");
    }
    catch (err) {
        await client.query("ROLLBACK");
        throw err;
    }
    finally {
        client.release();
    }
}
async function insertRelations(client, recipeId, mealTypes, ingredients, categories) {
    for (const ing of ingredients) {
        const res = await client.query("SELECT id FROM ingredients WHERE name = $1", [ing.name]);
        let ingredientId = res.rows[0]?.id;
        if (!ingredientId) {
            const insert = await client.query("INSERT INTO ingredients (name, calories_per_gram) VALUES ($1, $2) RETURNING id", [ing.name, ing.calories_per_gram]);
            ingredientId = insert.rows[0].id;
        }
        else {
            await client.query("UPDATE ingredients SET calories_per_gram = $1 WHERE id = $2", [ing.calories_per_gram, ingredientId]);
        }
        await client.query(`INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount, unit)
       VALUES ($1, $2, $3, $4)`, [recipeId, ingredientId, ing.amount, ing.unit]);
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
