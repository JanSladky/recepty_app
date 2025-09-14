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
/* =========================
 *     SUROVINY (CRUD)
 * ========================= */
async function getAllIngredientsFromDB() {
    try {
        const res = await db_1.default.query(`SELECT
         i.id, i.name, i.calories_per_gram, i.category_id,
         c.name AS category_name,
         i.default_grams, i.unit_name,
         i.off_id,
         i.energy_kcal_100g, i.proteins_100g, i.carbs_100g, i.sugars_100g,
         i.fat_100g, i.saturated_fat_100g, i.fiber_100g, i.sodium_100g,
         i.off_last_synced
       FROM ingredients i
       LEFT JOIN ingredient_categories c ON i.category_id = c.id
       ORDER BY i.name ASC`);
        return res.rows.map(rowToIngredient);
    }
    catch (e) {
        if (e instanceof Error && e.message.includes(`relation "ingredient_categories" does not exist`)) {
            const res = await db_1.default.query(`SELECT
           i.id, i.name, i.calories_per_gram, i.category_id,
           NULL::text AS category_name,
           i.default_grams, i.unit_name,
           i.off_id,
           i.energy_kcal_100g, i.proteins_100g, i.carbs_100g, i.sugars_100g,
           i.fat_100g, i.saturated_fat_100g, i.fiber_100g, i.sodium_100g,
           i.off_last_synced
         FROM ingredients i
         ORDER BY i.name ASC`);
            return res.rows.map(rowToIngredient);
        }
        throw e;
    }
}
function rowToIngredient(r) {
    return {
        id: Number(r.id),
        name: String(r.name),
        calories_per_gram: r.calories_per_gram == null ? 0 : Number(r.calories_per_gram),
        category_id: r.category_id == null ? null : Number(r.category_id),
        category_name: r.category_name ? String(r.category_name) : "",
        default_grams: r.default_grams == null ? null : Number(r.default_grams),
        unit_name: r.unit_name ?? null,
        off_id: r.off_id ?? null,
        energy_kcal_100g: r.energy_kcal_100g == null ? null : Number(r.energy_kcal_100g),
        proteins_100g: r.proteins_100g == null ? null : Number(r.proteins_100g),
        carbs_100g: r.carbs_100g == null ? null : Number(r.carbs_100g),
        sugars_100g: r.sugars_100g == null ? null : Number(r.sugars_100g),
        fat_100g: r.fat_100g == null ? null : Number(r.fat_100g),
        saturated_fat_100g: r.saturated_fat_100g == null ? null : Number(r.saturated_fat_100g),
        fiber_100g: r.fiber_100g == null ? null : Number(r.fiber_100g),
        sodium_100g: r.sodium_100g == null ? null : Number(r.sodium_100g),
        off_last_synced: r.off_last_synced ?? null,
    };
}
async function createIngredientInDB(name, calories_per_gram, category_id, default_grams, unit_name) {
    const res = await db_1.default.query(`INSERT INTO ingredients (name, calories_per_gram, category_id, default_grams, unit_name)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, calories_per_gram, category_id, default_grams, unit_name`, [name, calories_per_gram, category_id, default_grams ?? null, unit_name ?? null]);
    let category_name = "";
    try {
        const cat = await db_1.default.query("SELECT name FROM ingredient_categories WHERE id = $1", [category_id]);
        category_name = cat.rows[0]?.name || "";
    }
    catch {
        category_name = "";
    }
    const row = res.rows[0];
    return {
        id: Number(row.id),
        name: String(row.name),
        calories_per_gram: row.calories_per_gram == null ? 0 : Number(row.calories_per_gram),
        category_id: row.category_id == null ? null : Number(row.category_id),
        category_name,
        default_grams: row.default_grams == null ? null : Number(row.default_grams),
        unit_name: row.unit_name ?? null,
    };
}
async function updateIngredientInDB(id, name, calories_per_gram, category_id, default_grams, unit_name) {
    await db_1.default.query(`UPDATE ingredients
        SET name = $1,
            calories_per_gram = $2,
            category_id = $3,
            default_grams = $4,
            unit_name = $5
      WHERE id = $6`, [name, calories_per_gram, category_id, default_grams, unit_name, id]);
}
async function deleteIngredientFromDB(id) {
    try {
        await db_1.default.query("DELETE FROM recipe_ingredients WHERE ingredient_id = $1", [id]);
        const result = await db_1.default.query("DELETE FROM ingredients WHERE id = $1", [id]);
        return (result.rowCount ?? 0) > 0;
    }
    catch (error) {
        console.error("❌ Chyba při mazání suroviny:", error);
        throw error;
    }
}
/* =========================
 *  KATEGORIE SUROVIN
 * ========================= */
async function getAllIngredientCategories() {
    const res = await db_1.default.query("SELECT id, name FROM ingredient_categories ORDER BY name ASC");
    return res.rows.map((r) => ({ id: Number(r.id), name: String(r.name) }));
}
async function createIngredientCategory(name) {
    const res = await db_1.default.query("INSERT INTO ingredient_categories (name) VALUES ($1) RETURNING id, name", [name]);
    const row = res.rows[0];
    return { id: Number(row.id), name: String(row.name) };
}
async function updateIngredientCategory(id, name) {
    await db_1.default.query("UPDATE ingredient_categories SET name = $1 WHERE id = $2", [name, id]);
}
async function deleteIngredientCategory(id) {
    await db_1.default.query("DELETE FROM ingredient_categories WHERE id = $1", [id]);
}
/* =========================
 *     POMOCNÉ VÝPOČTY
 * ========================= */
function calculateTotalCalories(ingredients) {
    return ingredients.reduce((sum, ing) => {
        let weightInGrams = 0;
        if (ing.unit === "g" || ing.unit === "ml")
            weightInGrams = ing.amount;
        else if (ing.unit === "ks")
            weightInGrams = (ing.default_grams ?? 0) * ing.amount;
        else
            weightInGrams = ing.amount;
        const kcal = weightInGrams * (ing.calories_per_gram || 0);
        return Math.round(sum + kcal);
    }, 0);
}
function calculateNutritionTotals(ingredients) {
    return ingredients.reduce((acc, ing) => {
        let grams = 0;
        if (ing.unit === "g" || ing.unit === "ml")
            grams = ing.amount;
        else if (ing.unit === "ks")
            grams = (ing.default_grams ?? 0) * ing.amount;
        else
            grams = ing.amount;
        const factor = grams / 100;
        // energie – preferuj OFF (kcal/100g), jinak fallback z calories_per_gram
        const kcalFromOff = (ing.energy_kcal_100g ?? 0) * factor;
        const kcalFallback = (ing.calories_per_gram || 0) * grams;
        acc.kcal += Math.max(0, kcalFromOff || kcalFallback);
        acc.proteins += Math.max(0, (ing.proteins_100g ?? 0) * factor);
        acc.carbs += Math.max(0, (ing.carbs_100g ?? 0) * factor);
        acc.sugars += Math.max(0, (ing.sugars_100g ?? 0) * factor);
        acc.fat += Math.max(0, (ing.fat_100g ?? 0) * factor);
        acc.saturated_fat += Math.max(0, (ing.saturated_fat_100g ?? 0) * factor);
        acc.fiber += Math.max(0, (ing.fiber_100g ?? 0) * factor);
        acc.sodium += Math.max(0, (ing.sodium_100g ?? 0) * factor);
        return acc;
    }, {
        kcal: 0,
        proteins: 0,
        carbs: 0,
        sugars: 0,
        fat: 0,
        saturated_fat: 0,
        fiber: 0,
        sodium: 0,
    });
}
/* =========================
 *        RECEPTY
 * ========================= */
async function getAllRecipes() {
    const res = await db_1.default.query(`SELECT id, title, notes, image_url, steps, status, created_by
       FROM recipes
   ORDER BY title ASC`);
    const recipes = res.rows;
    for (const recipe of recipes) {
        const [mealRes, catRes] = await Promise.all([
            db_1.default.query(`SELECT m.name
           FROM recipe_meal_types rmt
           JOIN meal_types m ON rmt.meal_type_id = m.id
          WHERE rmt.recipe_id = $1`, [recipe.id]),
            db_1.default.query(`SELECT c.name
           FROM recipe_categories rc
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
    // ✨ ÚPRAVA: ber makra z OFF, a když OFF není, vezmi je z ingredients.*
    const tryAdvanced = async () => {
        const q = `
      SELECT
        ri.amount,
        ri.unit,
        ri.display,
        i.name,
        i.default_grams,

        -- kcal/g: preferuj i.calories_per_gram, jinak OFF/100
        COALESCE(i.calories_per_gram, op.energy_kcal_100g/100.0) AS calories_per_gram,

        -- MAKRA: preferuj OFF, fallback na ingredients.*
        COALESCE(op.energy_kcal_100g,   i.energy_kcal_100g)   AS energy_kcal_100g,
        COALESCE(op.proteins_100g,      i.proteins_100g)      AS proteins_100g,
        COALESCE(op.carbs_100g,         i.carbs_100g)         AS carbs_100g,
        COALESCE(op.sugars_100g,        i.sugars_100g)        AS sugars_100g,
        COALESCE(op.fat_100g,           i.fat_100g)           AS fat_100g,
        COALESCE(op.saturated_fat_100g, i.saturated_fat_100g) AS saturated_fat_100g,
        COALESCE(op.fiber_100g,         i.fiber_100g)         AS fiber_100g,
        COALESCE(op.sodium_100g,        i.sodium_100g)        AS sodium_100g
      FROM recipe_ingredients ri
      LEFT JOIN ingredients  i  ON ri.ingredient_id = i.id
      LEFT JOIN off_products op ON op.code = i.off_id
      WHERE ri.recipe_id = $1
    `;
        const { rows } = await db_1.default.query(q, [id]);
        return rows.map((row) => ({
            name: !row.name || row.name.trim() === "" ? "Neznámá surovina" : row.name,
            amount: Number(row.amount) || 0,
            unit: row.unit,
            calories_per_gram: Number(row.calories_per_gram) || 0,
            display: row.display && String(row.display).trim() !== "" ? String(row.display) : undefined,
            default_grams: row.default_grams == null ? undefined : Number(row.default_grams),
            energy_kcal_100g: row.energy_kcal_100g == null ? null : Number(row.energy_kcal_100g),
            proteins_100g: row.proteins_100g == null ? null : Number(row.proteins_100g),
            carbs_100g: row.carbs_100g == null ? null : Number(row.carbs_100g),
            sugars_100g: row.sugars_100g == null ? null : Number(row.sugars_100g),
            fat_100g: row.fat_100g == null ? null : Number(row.fat_100g),
            saturated_fat_100g: row.saturated_fat_100g == null ? null : Number(row.saturated_fat_100g),
            fiber_100g: row.fiber_100g == null ? null : Number(row.fiber_100g),
            sodium_100g: row.sodium_100g == null ? null : Number(row.sodium_100g),
        }));
    };
    const tryBasic = async () => {
        const q = `
      SELECT
        ri.amount,
        ri.unit,
        ri.display,
        i.name,
        i.default_grams,
        i.calories_per_gram
      FROM recipe_ingredients ri
      LEFT JOIN ingredients i ON ri.ingredient_id = i.id
      WHERE ri.recipe_id = $1
    `;
        const { rows } = await db_1.default.query(q, [id]);
        return rows.map((row) => ({
            name: !row.name || row.name.trim() === "" ? "Neznámá surovina" : row.name,
            amount: Number(row.amount) || 0,
            unit: row.unit,
            calories_per_gram: row.calories_per_gram == null ? 0 : Number(row.calories_per_gram),
            display: row.display && String(row.display).trim() !== "" ? String(row.display) : undefined,
            default_grams: row.default_grams == null ? undefined : Number(row.default_grams),
            energy_kcal_100g: null,
            proteins_100g: null,
            carbs_100g: null,
            sugars_100g: null,
            fat_100g: null,
            saturated_fat_100g: null,
            fiber_100g: null,
            sodium_100g: null,
        }));
    };
    let ingredients;
    try {
        ingredients = await tryAdvanced();
    }
    catch {
        ingredients = await tryBasic();
    }
    const [categoriesRes, mealTypesRes] = await Promise.all([
        db_1.default.query("SELECT c.name FROM recipe_categories rc JOIN categories c ON rc.category_id = c.id WHERE rc.recipe_id = $1", [id]),
        db_1.default.query("SELECT m.name FROM recipe_meal_types rmt JOIN meal_types m ON rmt.meal_type_id = m.id WHERE rmt.recipe_id = $1", [id]),
    ]);
    const nutritionTotals = calculateNutritionTotals(ingredients);
    const totalCalories = Math.round(nutritionTotals.kcal);
    const uniqueMealTypes = Array.from(new Set(mealTypesRes.rows.map((r) => {
        const name = r.name.trim().toLowerCase();
        return name.charAt(0).toUpperCase() + name.slice(1);
    })));
    return {
        ...recipe,
        calories: totalCalories,
        steps: recipe.steps ?? [],
        ingredients,
        categories: categoriesRes.rows.map((r) => r.name),
        meal_types: uniqueMealTypes,
        nutrition_totals: {
            kcal: Math.round(nutritionTotals.kcal),
            proteins: Math.round(nutritionTotals.proteins * 10) / 10,
            carbs: Math.round(nutritionTotals.carbs * 10) / 10,
            sugars: Math.round(nutritionTotals.sugars * 10) / 10,
            fat: Math.round(nutritionTotals.fat * 10) / 10,
            saturated_fat: Math.round(nutritionTotals.saturated_fat * 10) / 10,
            fiber: Math.round(nutritionTotals.fiber * 10) / 10,
            sodium: Math.round(nutritionTotals.sodium * 1000) / 1000,
        },
    };
}
/* =========================
 *      ULOŽENÍ VZTAHŮ
 * ========================= */
async function insertRelations(client, recipeId, mealTypes, ingredients, categories) {
    for (const ing of ingredients) {
        // 1) existuje už surovina?
        const res = await client.query("SELECT id, off_id FROM ingredients WHERE name = $1", [ing.name]);
        let ingredientId = res.rows[0]?.id;
        const currentOffId = res.rows[0]?.off_id ?? null;
        // 2) vlož novou (ulož i off_id)
        if (!ingredientId) {
            const insert = await client.query(`INSERT INTO ingredients (name, calories_per_gram, default_grams, unit_name, category_id, off_id,
                                  energy_kcal_100g, proteins_100g, carbs_100g, sugars_100g,
                                  fat_100g, saturated_fat_100g, fiber_100g, sodium_100g)
         VALUES ($1, $2, $3, $4, 5, $5, $6,$7,$8,$9,$10,$11,$12,$13)
         RETURNING id`, [
                ing.name,
                ing.calories_per_gram,
                ing.default_grams ?? null,
                ing.unit || null,
                ing.off_id ?? null,
                ing.energy_kcal_100g ?? null,
                ing.proteins_100g ?? null,
                ing.carbs_100g ?? null,
                ing.sugars_100g ?? null,
                ing.fat_100g ?? null,
                ing.saturated_fat_100g ?? null,
                ing.fiber_100g ?? null,
                ing.sodium_100g ?? null,
            ]);
            ingredientId = insert.rows[0].id;
            // pokud calories_per_gram není a máme energy_kcal_100g, dopočítej
            if ((!ing.calories_per_gram || ing.calories_per_gram === 0) && ing.energy_kcal_100g != null) {
                await client.query(`UPDATE ingredients SET calories_per_gram = $1 WHERE id = $2`, [Number(ing.energy_kcal_100g) / 100, ingredientId]);
            }
        }
        else {
            // 3) pokud přichází off_id a není v DB, doplň ho
            if (ing.off_id && ing.off_id !== currentOffId) {
                await client.query(`UPDATE ingredients SET off_id = $1 WHERE id = $2`, [ing.off_id, ingredientId]);
            }
            // 3b) ✨ pokud jde o „vlastní“ surovinu (nebo chceme aktualizovat lokální makra),
            //     propíšeme makra do tabulky ingredients (jen když dorazí nějaká hodnota)
            await client.query(`UPDATE ingredients SET
           energy_kcal_100g   = COALESCE($2, energy_kcal_100g),
           proteins_100g      = COALESCE($3, proteins_100g),
           carbs_100g         = COALESCE($4, carbs_100g),
           sugars_100g        = COALESCE($5, sugars_100g),
           fat_100g           = COALESCE($6, fat_100g),
           saturated_fat_100g = COALESCE($7, saturated_fat_100g),
           fiber_100g         = COALESCE($8, fiber_100g),
           sodium_100g        = COALESCE($9, sodium_100g)
         WHERE id = $1`, [
                ingredientId,
                ing.energy_kcal_100g ?? null,
                ing.proteins_100g ?? null,
                ing.carbs_100g ?? null,
                ing.sugars_100g ?? null,
                ing.fat_100g ?? null,
                ing.saturated_fat_100g ?? null,
                ing.fiber_100g ?? null,
                ing.sodium_100g ?? null,
            ]);
            // 3c) když nemáš calories_per_gram a teď už máme energy_kcal_100g, dopočítej
            if ((!ing.calories_per_gram || ing.calories_per_gram === 0) && ing.energy_kcal_100g != null) {
                await client.query(`UPDATE ingredients
             SET calories_per_gram = COALESCE(calories_per_gram, $2)
           WHERE id = $1`, [ingredientId, Number(ing.energy_kcal_100g) / 100]);
            }
        }
        // 4) upsert do off_products (pokud máme off_id)
        if (ing.off_id) {
            await client.query(`INSERT INTO off_products
           (code, energy_kcal_100g, proteins_100g, carbs_100g, sugars_100g,
            fat_100g, saturated_fat_100g, fiber_100g, sodium_100g)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (code) DO UPDATE SET
           energy_kcal_100g   = COALESCE(EXCLUDED.energy_kcal_100g,   off_products.energy_kcal_100g),
           proteins_100g      = COALESCE(EXCLUDED.proteins_100g,      off_products.proteins_100g),
           carbs_100g         = COALESCE(EXCLUDED.carbs_100g,         off_products.carbs_100g),
           sugars_100g        = COALESCE(EXCLUDED.sugars_100g,        off_products.sugars_100g),
           fat_100g           = COALESCE(EXCLUDED.fat_100g,           off_products.fat_100g),
           saturated_fat_100g = COALESCE(EXCLUDED.saturated_fat_100g, off_products.saturated_fat_100g),
           fiber_100g         = COALESCE(EXCLUDED.fiber_100g,         off_products.fiber_100g),
           sodium_100g        = COALESCE(EXCLUDED.sodium_100g,        off_products.sodium_100g)`, [
                ing.off_id,
                ing.energy_kcal_100g ?? null,
                ing.proteins_100g ?? null,
                ing.carbs_100g ?? null,
                ing.sugars_100g ?? null,
                ing.fat_100g ?? null,
                ing.saturated_fat_100g ?? null,
                ing.fiber_100g ?? null,
                ing.sodium_100g ?? null,
            ]);
        }
        // 5) display text (polovina/třetina/čtvrtina…)
        let displayText = ing.display ?? null;
        if (ing.unit === "ks") {
            if (Math.abs(ing.amount - 0.5) < 0.0001)
                displayText = `polovina ${ing.name}`;
            else if (Math.abs(ing.amount - 1 / 3) < 0.0001)
                displayText = `třetina ${ing.name}`;
            else if (Math.abs(ing.amount - 0.25) < 0.0001)
                displayText = `čtvrtina ${ing.name}`;
        }
        await client.query(`INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount, unit, display)
       VALUES ($1, $2, $3, $4, $5)`, [recipeId, ingredientId, ing.amount, ing.unit, displayText]);
    }
    // kategorie
    for (const cat of categories) {
        const res = await client.query("SELECT id FROM categories WHERE name = $1", [cat]);
        const categoryId = res.rows[0]?.id ?? (await client.query("INSERT INTO categories (name) VALUES ($1) RETURNING id", [cat])).rows[0].id;
        await client.query("INSERT INTO recipe_categories (recipe_id, category_id) VALUES ($1, $2)", [recipeId, categoryId]);
    }
    // typy jídel
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
/* =========================
 *   RECEPTY: CREATE/UPDATE
 * ========================= */
async function createFullRecipe(title, notes, imageUrl, mealTypes, ingredients, categories, steps) {
    const client = await db_1.default.connect();
    try {
        await client.query("BEGIN");
        const result = await client.query(`INSERT INTO recipes (title, notes, image_url, steps)
       VALUES ($1, $2, $3, $4::jsonb)
       RETURNING id`, [title, notes, imageUrl, JSON.stringify(steps)]);
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
        await client.query(`UPDATE recipes
          SET title = $1,
              notes = $2,
              image_url = $3,
              steps = $4::jsonb
        WHERE id = $5`, [title, notes, imageUrl, JSON.stringify(steps), id]);
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
/* =========================
 *     OBLÍBENÉ RECEPTY
 * ========================= */
async function getFavoriteRecipeIdsForUser(userId) {
    const res = await db_1.default.query(`SELECT recipe_id FROM user_favorites WHERE user_id = $1`, [userId]);
    return res.rows.map((row) => row.recipe_id);
}
async function addFavoriteInDB(userId, recipeId) {
    await db_1.default.query(`INSERT INTO user_favorites (user_id, recipe_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`, [userId, recipeId]);
}
async function removeFavoriteInDB(userId, recipeId) {
    await db_1.default.query(`DELETE FROM user_favorites WHERE user_id = $1 AND recipe_id = $2`, [userId, recipeId]);
}
/* =========================
 *  SUROVINY PRO VÍCE RECEPTŮ
 * ========================= */
async function getIngredientsForRecipes(recipeIds) {
    if (recipeIds.length === 0)
        return [];
    const query = `
    SELECT i.name, ri.amount, ri.unit, i.calories_per_gram, i.default_grams
      FROM recipe_ingredients ri
      JOIN ingredients i ON ri.ingredient_id = i.id
     WHERE ri.recipe_id = ANY($1::int[])
  `;
    const res = await db_1.default.query(query, [recipeIds]);
    return res.rows;
}
