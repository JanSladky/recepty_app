"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllRecipes = getAllRecipes;
exports.getRecipeByIdFromDB = getRecipeByIdFromDB;
exports.createFullRecipe = createFullRecipe;
exports.updateRecipeInDB = updateRecipeInDB;
exports.deleteRecipeFromDB = deleteRecipeFromDB;
const db_1 = __importDefault(require("../utils/db"));
async function getAllRecipes() {
    const result = await db_1.default.query("SELECT id, title, description, image_url FROM recipes");
    const recipeRows = result.rows;
    const recipesWithRelations = await Promise.all(recipeRows.map(async (recipe) => {
        const categoryRes = await db_1.default.query("SELECT c.name FROM recipe_categories rc JOIN categories c ON rc.category_id = c.id WHERE rc.recipe_id = $1", [
            recipe.id,
        ]);
        const mealTypeRes = await db_1.default.query("SELECT m.name FROM recipe_meal_types rmt JOIN meal_types m ON rmt.meal_type_id = m.id WHERE rmt.recipe_id = $1", [
            recipe.id,
        ]);
        return {
            ...recipe,
            categories: categoryRes.rows.map((c) => c.name),
            meal_types: mealTypeRes.rows.map((m) => m.name),
        };
    }));
    return recipesWithRelations;
}
async function getRecipeByIdFromDB(id) {
    const { rows: recipeRows } = await db_1.default.query("SELECT id, title, description, image_url, steps FROM recipes WHERE id = $1", [id]);
    const recipe = recipeRows[0];
    if (!recipe)
        return null;
    const { rows: ingredients, } = await db_1.default.query("SELECT ri.amount, ri.unit, i.name FROM recipe_ingredients ri JOIN ingredients i ON ri.ingredient_id = i.id WHERE ri.recipe_id = $1", [
        id,
    ]);
    const { rows: categories } = await db_1.default.query("SELECT c.name FROM recipe_categories rc JOIN categories c ON rc.category_id = c.id WHERE rc.recipe_id = $1", [
        id,
    ]);
    const { rows: mealTypes } = await db_1.default.query("SELECT m.name FROM recipe_meal_types rmt JOIN meal_types m ON rmt.meal_type_id = m.id WHERE rmt.recipe_id = $1", [
        id,
    ]);
    return {
        ...recipe,
        steps: recipe.steps ?? [],
        ingredients,
        categories: categories.map((c) => c.name),
        meal_types: mealTypes.map((m) => m.name),
    };
}
async function createFullRecipe(title, description, imageUrl, mealTypes, ingredients, categories, steps) {
    const client = await db_1.default.connect();
    try {
        await client.query("BEGIN");
        const stepsJson = JSON.stringify(steps); // ← DŮLEŽITÉ
        const result = await client.query("INSERT INTO recipes (title, description, image_url, steps) VALUES ($1, $2, $3, $4::jsonb) RETURNING id", [
            title,
            description,
            imageUrl,
            stepsJson,
        ]);
        const recipeId = result.rows[0].id;
        await insertRelations(client, recipeId, mealTypes, ingredients, categories);
        await client.query("COMMIT");
        return recipeId;
    }
    catch (error) {
        await client.query("ROLLBACK");
        throw error;
    }
    finally {
        client.release();
    }
}
async function updateRecipeInDB(id, title, description, imageUrl, mealTypes, ingredients, categories, steps) {
    const client = await db_1.default.connect();
    try {
        await client.query("BEGIN");
        const stepsJson = JSON.stringify(steps);
        const shouldUpdateImage = typeof imageUrl === "string" && imageUrl.trim() !== "" && imageUrl !== "null";
        if (shouldUpdateImage) {
            await client.query("UPDATE recipes SET title = $1, description = $2, image_url = $3, steps = $4::jsonb WHERE id = $5", [
                title,
                description,
                imageUrl,
                stepsJson,
                id,
            ]);
        }
        else {
            await client.query("UPDATE recipes SET title = $1, description = $2, steps = $3::jsonb WHERE id = $4", [title, description, stepsJson, id]);
        }
        await client.query("DELETE FROM recipe_ingredients WHERE recipe_id = $1", [id]);
        await client.query("DELETE FROM recipe_categories WHERE recipe_id = $1", [id]);
        await client.query("DELETE FROM recipe_meal_types WHERE recipe_id = $1", [id]);
        await insertRelations(client, id, mealTypes, ingredients, categories);
        await client.query("COMMIT");
    }
    catch (error) {
        await client.query("ROLLBACK");
        console.error("❌ Chyba při updateRecipeInDB:", error);
        throw error;
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
    catch (error) {
        await client.query("ROLLBACK");
        throw error;
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
            const insertRes = await client.query("INSERT INTO ingredients (name) VALUES ($1) RETURNING id", [ing.name]);
            ingredientId = insertRes.rows[0].id;
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
        let categoryId = res.rows[0]?.id;
        if (!categoryId) {
            const insertRes = await client.query("INSERT INTO categories (name) VALUES ($1) RETURNING id", [cat]);
            categoryId = insertRes.rows[0].id;
        }
        await client.query("INSERT INTO recipe_categories (recipe_id, category_id) VALUES ($1, $2)", [recipeId, categoryId]);
    }
    for (const meal of mealTypes) {
        const res = await client.query("SELECT id FROM meal_types WHERE name = $1", [meal]);
        let mealTypeId = res.rows[0]?.id;
        if (!mealTypeId) {
            const insertRes = await client.query("INSERT INTO meal_types (name) VALUES ($1) RETURNING id", [meal]);
            mealTypeId = insertRes.rows[0].id;
        }
        await client.query("INSERT INTO recipe_meal_types (recipe_id, meal_type_id) VALUES ($1, $2)", [recipeId, mealTypeId]);
    }
}
