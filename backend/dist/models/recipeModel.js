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
exports.getFavoriteRecipeIdsForUser = getFavoriteRecipeIdsForUser;
exports.addFavoriteInDB = addFavoriteInDB;
exports.removeFavoriteInDB = removeFavoriteInDB;
exports.getIngredientsForRecipes = getIngredientsForRecipes;
const db_1 = __importDefault(require("../utils/db"));
// --- SUROVINY ---
async function getAllIngredientsFromDB() {
    const res = await db_1.default.query(`SELECT i.id, i.name, i.calories_per_gram, i.category_id, c.name AS category_name,
            i.default_grams, i.unit_name
     FROM ingredients i
     LEFT JOIN ingredient_categories c ON i.category_id = c.id
     ORDER BY i.name ASC`);
    return res.rows;
}
async function createIngredientInDB(name, calories_per_gram, category_id, default_grams, unit_name) {
    const res = await db_1.default.query(`INSERT INTO ingredients (name, calories_per_gram, category_id, default_grams, unit_name)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, calories_per_gram, category_id, default_grams, unit_name`, [name, calories_per_gram, category_id, default_grams, unit_name]);
    const cat = await db_1.default.query("SELECT name FROM ingredient_categories WHERE id = $1", [category_id]);
    return { ...res.rows[0], category_name: cat.rows[0]?.name || "" };
}
async function updateIngredientInDB(id, name, calories_per_gram, category_id, default_grams, unit_name) {
    await db_1.default.query(`UPDATE ingredients
     SET name = $1, calories_per_gram = $2, category_id = $3,
         default_grams = $4, unit_name = $5
     WHERE id = $6`, [name, calories_per_gram, category_id, default_grams, unit_name, id]);
}
async function deleteIngredientFromDB(id) {
    await db_1.default.query("DELETE FROM ingredients WHERE id = $1", [id]);
}
// --- KATEGORIE SUROVIN ---
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
// --- RECEPTY ---
function calculateTotalCalories(ingredients) {
    return ingredients.reduce((sum, ing) => {
        let weightInGrams = 0;
        if (ing.unit === "g" || ing.unit === "ml") {
            weightInGrams = ing.amount;
        }
        else if (ing.unit === "ks") {
            weightInGrams = (ing.default_grams ?? 0) * ing.amount;
        }
        else {
            weightInGrams = ing.amount;
        }
        const kcal = weightInGrams * (ing.calories_per_gram || 0);
        return Math.round(sum + kcal);
    }, 0);
}
async function getAllRecipes() {
    const res = await db_1.default.query("SELECT id, title, notes, image_url, steps FROM recipes ORDER BY title ASC");
    const recipes = res.rows;
    for (const recipe of recipes) {
        const [mealRes, catRes] = await Promise.all([
            db_1.default.query(`SELECT m.name FROM recipe_meal_types rmt 
             JOIN meal_types m ON rmt.meal_type_id = m.id 
             WHERE rmt.recipe_id = $1`, [recipe.id]),
            db_1.default.query(`SELECT c.name FROM recipe_categories rc 
             JOIN categories c ON rc.category_id = c.id 
             WHERE rc.recipe_id = $1`, [recipe.id]),
        ]);
        recipe.meal_types = mealRes.rows.map((r) => r.name);
        recipe.categories = catRes.rows.map((r) => r.name);
    }
    return recipes;
}
async function getRecipeByIdFromDB(id) {
    const recipeRes = await db_1.default.query("SELECT * FROM recipes WHERE id = $1", [id]);
    const recipe = recipeRes.rows[0];
    if (!recipe)
        return null;
    const [ingredientsRes, categoriesRes, mealTypesRes] = await Promise.all([
        db_1.default.query(`SELECT ri.amount, ri.unit, ri.display, i.name, i.calories_per_gram, i.default_grams
       FROM recipe_ingredients ri
       JOIN ingredients i ON ri.ingredient_id = i.id
       WHERE ri.recipe_id = $1`, [id]),
        db_1.default.query("SELECT c.name FROM recipe_categories rc JOIN categories c ON rc.category_id = c.id WHERE rc.recipe_id = $1", [id]),
        db_1.default.query("SELECT m.name FROM recipe_meal_types rmt JOIN meal_types m ON rmt.meal_type_id = m.id WHERE rmt.recipe_id = $1", [id]),
    ]);
    const ingredients = ingredientsRes.rows.map((row) => ({
        name: row.name,
        amount: row.amount,
        unit: row.unit,
        calories_per_gram: row.calories_per_gram,
        display: row.display ?? undefined,
        default_grams: row.default_grams ?? null,
    }));
    const totalCalories = calculateTotalCalories(ingredients);
    const uniqueMealTypes = Array.from(new Set(mealTypesRes.rows.map((r) => {
        const name = r.name.trim().toLowerCase();
        return name.charAt(0).toUpperCase() + name.slice(1);
    })));
    return {
        ...recipe,
        calories: totalCalories,
        steps: recipe.steps ?? [],
        ingredients: ingredients,
        categories: categoriesRes.rows.map((r) => r.name),
        meal_types: uniqueMealTypes,
    };
}
async function insertRelations(client, recipeId, mealTypes, ingredients, categories) {
    for (const ing of ingredients) {
        const res = await client.query("SELECT id FROM ingredients WHERE name = $1", [ing.name]);
        let ingredientId = res.rows[0]?.id;
        if (!ingredientId) {
            const insert = await client.query(`INSERT INTO ingredients (name, calories_per_gram, default_grams, unit_name, category_id)
         VALUES ($1, $2, $3, $4, 5) -- Pozn: default kategorie 5 jako záchrana
         RETURNING id`, [ing.name, ing.calories_per_gram, ing.amount || null, ing.unit || null]);
            ingredientId = insert.rows[0].id;
        }
        let displayText = ing.display ?? null;
        if (ing.unit === "ks") {
            if (ing.amount === 0.5)
                displayText = `polovina ${ing.name}`;
            else if (ing.amount === 1 / 3)
                displayText = `třetina ${ing.name}`;
            else if (ing.amount === 0.25)
                displayText = `čtvrtina ${ing.name}`;
        }
        await client.query(`INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount, unit, display)
       VALUES ($1, $2, $3, $4, $5)`, [recipeId, ingredientId, ing.amount, ing.unit, displayText]);
    }
    for (const cat of categories) {
        const res = await client.query("SELECT id FROM categories WHERE name = $1", [cat]);
        const categoryId = res.rows[0]?.id ?? (await client.query("INSERT INTO categories (name) VALUES ($1) RETURNING id", [cat])).rows[0].id;
        await client.query("INSERT INTO recipe_categories (recipe_id, category_id) VALUES ($1, $2)", [recipeId, categoryId]);
    }
    const uniqueMealTypes = [...new Set(mealTypes.map((m) => m.trim().toLowerCase()))];
    for (const meal of uniqueMealTypes) {
        const existing = await client.query("SELECT id, name FROM meal_types WHERE LOWER(name) = $1", [meal]);
        let mealTypeId;
        const properName = meal.charAt(0).toUpperCase() + meal.slice(1);
        if (existing.rows.length > 0) {
            mealTypeId = existing.rows[0].id;
            if (existing.rows[0].name !== properName) {
                await client.query("UPDATE meal_types SET name = $1 WHERE id = $2", [properName, mealTypeId]);
            }
        }
        else {
            const insert = await client.query("INSERT INTO meal_types (name) VALUES ($1) RETURNING id", [properName]);
            mealTypeId = insert.rows[0].id;
        }
        await client.query("INSERT INTO recipe_meal_types (recipe_id, meal_type_id) VALUES ($1, $2)", [recipeId, mealTypeId]);
    }
}
async function createFullRecipe(title, notes, imageUrl, mealTypes, ingredients, categories, steps) {
    const client = await db_1.default.connect();
    try {
        await client.query("BEGIN");
        const result = await client.query(`INSERT INTO recipes (title, notes, image_url, steps) VALUES ($1, $2, $3, $4::jsonb) RETURNING id`, [
            title,
            notes,
            imageUrl,
            JSON.stringify(steps),
        ]);
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
async function updateRecipeInDB(id, title, notes, imageUrl, mealTypes, ingredients, categories, steps) {
    const client = await db_1.default.connect();
    try {
        await client.query("BEGIN");
        await client.query(`UPDATE recipes SET title = $1, notes = $2, image_url = $3, steps = $4::jsonb WHERE id = $5`, [
            title,
            notes,
            imageUrl,
            JSON.stringify(steps),
            id,
        ]);
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
// --- OBLÍBENÉ RECEPTY ---
// Získá pole IDček všech oblíbených receptů pro daného uživatele
async function getFavoriteRecipeIdsForUser(userId) {
    const res = await db_1.default.query(`SELECT recipe_id FROM user_favorites WHERE user_id = $1`, [userId]);
    return res.rows.map((row) => row.recipe_id);
}
// Přidá recept do oblíbených pro daného uživatele
async function addFavoriteInDB(userId, recipeId) {
    // "ON CONFLICT DO NOTHING" zajistí, že se nestane chyba, pokud už je recept v oblíbených
    await db_1.default.query(`INSERT INTO user_favorites (user_id, recipe_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [userId, recipeId]);
}
// Odebere recept z oblíbených pro daného uživatele
async function removeFavoriteInDB(userId, recipeId) {
    await db_1.default.query(`DELETE FROM user_favorites WHERE user_id = $1 AND recipe_id = $2`, [userId, recipeId]);
}
// Získá všechny suroviny pro zadaná ID receptů (pro nákupní seznam)
async function getIngredientsForRecipes(recipeIds) {
    console.log("recipeIds to fetch:", recipeIds);
    if (recipeIds.length === 0) {
        return [];
    }
    const query = `
        SELECT i.name, ri.amount, ri.unit, i.calories_per_gram, i.default_grams
        FROM recipe_ingredients ri
        JOIN ingredients i ON ri.ingredient_id = i.id
        WHERE ri.recipe_id = ANY($1::int[])
    `;
    const res = await db_1.default.query(query, [recipeIds]);
    return res.rows;
}
