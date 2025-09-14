"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getAllCategories = exports.deleteIngredient = exports.updateIngredient = exports.createIngredient = exports.getAllIngredients = exports.rejectRecipe = exports.approveRecipe = exports.getPendingRecipes = exports.submitRecipe = exports.deleteRecipe = exports.updateRecipe = exports.addRecipe = exports.getRecipeById = exports.getRecipes = void 0;
exports.searchLocalIngredients = searchLocalIngredients;
const db_1 = __importDefault(require("../utils/db"));
const recipeModel_1 = require("../models/recipeModel");
function ensureAdmin(req, res) {
    const role = req.user?.role;
    if (!req.user) {
        res.status(401).json({ error: "Nejste přihlášen." });
        return false;
    }
    if (!role || !["ADMIN", "SUPERADMIN"].includes(role)) {
        res.status(403).json({ error: "Přístup zamítnut. Musíte být administrátor." });
        return false;
    }
    return true;
}
function ensureLoggedIn(req, res) {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ error: "Nejste přihlášen." });
        return null;
    }
    return userId;
}
function parseJSON(value, fallback) {
    if (typeof value === "string" && value.trim() !== "") {
        try {
            return JSON.parse(value);
        }
        catch {
            return fallback;
        }
    }
    return value ?? fallback;
}
/** ====== PŮVODNÍ JSON parser (ponechán jako fallback) ====== */
function processIngredients(raw) {
    let arr;
    if (typeof raw === "string") {
        try {
            arr = JSON.parse(raw);
        }
        catch {
            throw new Error("Chybný formát ingrediencí.");
        }
    }
    else {
        arr = raw;
    }
    if (!Array.isArray(arr))
        throw new Error("Ingredience nejsou ve správném formátu.");
    return arr.map((i) => {
        const ingredient_id = i.ingredient_id !== undefined ? Number(i.ingredient_id)
            : i.id !== undefined ? Number(i.id)
                : 0;
        const base = {
            ingredient_id,
            amount: Number(i.amount ?? 0),
            unit: String(i.unit ?? ""),
            calories_per_gram: Number(i.calories_per_gram ?? 0),
        };
        if (i.category_id !== undefined)
            base.category_id = Number(i.category_id);
        if (i.category_name !== undefined)
            base.category_name = String(i.category_name);
        if (i.default_grams !== undefined && i.default_grams !== null && i.default_grams !== "")
            base.default_grams = Number(i.default_grams);
        if (i.display !== undefined)
            base.display = String(i.display);
        if (i.name !== undefined)
            base.name = String(i.name);
        // OFF ID + makra (pokud dorazí přes JSON)
        if (i.off_id !== undefined)
            base.off_id = String(i.off_id);
        if (i.energy_kcal_100g !== undefined && i.energy_kcal_100g !== "")
            base.energy_kcal_100g = Number(i.energy_kcal_100g);
        if (i.proteins_100g !== undefined && i.proteins_100g !== "")
            base.proteins_100g = Number(i.proteins_100g);
        if (i.carbs_100g !== undefined && i.carbs_100g !== "")
            base.carbs_100g = Number(i.carbs_100g);
        if (i.sugars_100g !== undefined && i.sugars_100g !== "")
            base.sugars_100g = Number(i.sugars_100g);
        if (i.fat_100g !== undefined && i.fat_100g !== "")
            base.fat_100g = Number(i.fat_100g);
        if (i.saturated_fat_100g !== undefined && i.saturated_fat_100g !== "")
            base.saturated_fat_100g = Number(i.saturated_fat_100g);
        if (i.fiber_100g !== undefined && i.fiber_100g !== "")
            base.fiber_100g = Number(i.fiber_100g);
        if (i.sodium_100g !== undefined && i.sodium_100g !== "")
            base.sodium_100g = Number(i.sodium_100g);
        return base;
    });
}
/** ====== NOVÝ parser pro rozbalené FormData: ingredients[0][...] ====== */
function collectIngredientsFromBody(body) {
    // Pokud dorazil starý JSON způsob, použij ho
    if (body.ingredients && (typeof body.ingredients === "string" || Array.isArray(body.ingredients))) {
        return processIngredients(body.ingredients);
    }
    const byIndex = {};
    for (const rawKey of Object.keys(body)) {
        const m = rawKey.match(/^ingredients\[(\d+)\]\[(.+)\]$/);
        if (!m)
            continue;
        const [, idx, field] = m;
        if (!byIndex[idx])
            byIndex[idx] = {};
        const v = body[rawKey];
        if ([
            "amount", "calories_per_gram", "default_grams",
            "energy_kcal_100g", "proteins_100g", "carbs_100g", "sugars_100g",
            "fat_100g", "saturated_fat_100g", "fiber_100g", "sodium_100g"
        ].includes(field)) {
            byIndex[idx][field] = (v === "" || v == null) ? null : Number(v);
            continue;
        }
        if (["name", "unit", "display", "off_id"].includes(field)) {
            byIndex[idx][field] = v ?? "";
            continue;
        }
    }
    const out = Object.values(byIndex).map((r) => ({
        name: String(r.name ?? ""),
        amount: Number(r.amount ?? 0),
        unit: String(r.unit ?? "g"),
        calories_per_gram: Number(r.calories_per_gram ?? 0),
        display: r.display == null || r.display === "" ? undefined : String(r.display),
        default_grams: r.default_grams === null || r.default_grams === undefined ? null : Number(r.default_grams),
        off_id: r.off_id == null || r.off_id === "" ? null : String(r.off_id),
        energy_kcal_100g: r.energy_kcal_100g == null ? null : Number(r.energy_kcal_100g),
        proteins_100g: r.proteins_100g == null ? null : Number(r.proteins_100g),
        carbs_100g: r.carbs_100g == null ? null : Number(r.carbs_100g),
        sugars_100g: r.sugars_100g == null ? null : Number(r.sugars_100g),
        fat_100g: r.fat_100g == null ? null : Number(r.fat_100g),
        saturated_fat_100g: r.saturated_fat_100g == null ? null : Number(r.saturated_fat_100g),
        fiber_100g: r.fiber_100g == null ? null : Number(r.fiber_100g),
        sodium_100g: r.sodium_100g == null ? null : Number(r.sodium_100g),
    }));
    return out;
}
function getUploadedImageUrl(req) {
    const file = req.file;
    return file?.secure_url || file?.path || null;
}
/** ---------- RECEPTY ---------- **/
const getRecipes = async (_req, res) => {
    try {
        const all = (await (0, recipeModel_1.getAllRecipes)());
        const onlyApproved = all.filter((r) => (r.status ?? "APPROVED") === "APPROVED");
        res.status(200).json(onlyApproved);
    }
    catch (err) {
        console.error("getRecipes error:", err);
        res.status(500).json({ error: "Chyba při načítání receptů." });
    }
};
exports.getRecipes = getRecipes;
const getRecipeById = async (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        res.status(400).json({ error: "Neplatné ID receptu." });
        return;
    }
    try {
        const recipe = (await (0, recipeModel_1.getRecipeByIdFromDB)(id));
        if (!recipe) {
            res.status(404).json({ error: "Recept nenalezen." });
            return;
        }
        const status = recipe.status ?? "APPROVED";
        if (status !== "APPROVED") {
            const role = req.user?.role;
            const userId = req.user?.id;
            const isModerator = role === "ADMIN" || role === "SUPERADMIN";
            const isAuthor = userId && recipe.created_by && Number(recipe.created_by) === Number(userId);
            if (!isModerator && !isAuthor) {
                res.status(404).json({ error: "Recept nenalezen." });
                return;
            }
        }
        res.status(200).json(recipe);
    }
    catch (err) {
        console.error("getRecipeById error:", err);
        res.status(500).json({ error: "Chyba serveru při načítání receptu." });
    }
};
exports.getRecipeById = getRecipeById;
const addRecipe = async (req, res) => {
    try {
        if (!ensureAdmin(req, res))
            return;
        const { title, notes, categories, mealTypes, steps } = req.body;
        const parsedIngredients = collectIngredientsFromBody(req.body);
        if (!title || parsedIngredients.length === 0) {
            res.status(400).json({ error: "Chybí povinná pole (title/ingredients)." });
            return;
        }
        const parsedCategories = parseJSON(categories, []);
        const parsedMealTypes = parseJSON(mealTypes, []);
        const parsedSteps = parseJSON(steps, []);
        const imageUrl = getUploadedImageUrl(req) ?? "";
        const recipeId = await (0, recipeModel_1.createFullRecipe)(title, notes ?? "", imageUrl, parsedMealTypes, parsedIngredients, parsedCategories, parsedSteps);
        res.status(201).json({ message: "Recept uložen.", id: recipeId });
    }
    catch (error) {
        console.error("addRecipe error:", error);
        res.status(500).json({ error: "Nepodařilo se uložit recept.", detail: error.message });
    }
};
exports.addRecipe = addRecipe;
const updateRecipe = async (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        res.status(400).json({ error: "Neplatné ID receptu." });
        return;
    }
    try {
        if (!ensureAdmin(req, res))
            return;
        const { title, notes, categories, mealTypes, steps, existingImageUrl } = req.body;
        const parsedIngredients = collectIngredientsFromBody(req.body);
        if (!title || parsedIngredients.length === 0) {
            res.status(400).json({ error: "Chybí povinná pole (title/ingredients)." });
            return;
        }
        const parsedCategories = parseJSON(categories, []);
        const parsedMealTypes = parseJSON(mealTypes, []);
        const parsedSteps = parseJSON(steps, []);
        const uploadedUrl = getUploadedImageUrl(req);
        const finalImageUrl = uploadedUrl ?? (existingImageUrl || null);
        await (0, recipeModel_1.updateRecipeInDB)(id, title, notes ?? "", finalImageUrl, parsedMealTypes, parsedIngredients, parsedCategories, parsedSteps);
        res.status(200).json({ message: "Recept úspěšně upraven." });
    }
    catch (error) {
        console.error("updateRecipe error:", error);
        res.status(500).json({ error: "Nepodařilo se upravit recept.", detail: error.message });
    }
};
exports.updateRecipe = updateRecipe;
const deleteRecipe = async (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        res.status(400).json({ error: "Neplatné ID." });
        return;
    }
    try {
        if (!ensureAdmin(req, res))
            return;
        await (0, recipeModel_1.deleteRecipeFromDB)(id);
        res.status(200).json({ message: "Recept smazán." });
    }
    catch {
        res.status(500).json({ error: "Nepodařilo se smazat recept." });
    }
};
exports.deleteRecipe = deleteRecipe;
/** ---------- Moderace ---------- **/
const submitRecipe = async (req, res) => {
    const userId = ensureLoggedIn(req, res);
    if (!userId)
        return;
    try {
        const { title, notes, categories, mealTypes, steps } = req.body;
        const parsedIngredients = collectIngredientsFromBody(req.body);
        if (!title || parsedIngredients.length === 0) {
            res.status(400).json({ error: "Chybí povinná pole (title/ingredients)." });
            return;
        }
        const parsedCategories = parseJSON(categories, []);
        const parsedMealTypes = parseJSON(mealTypes, []);
        const parsedSteps = parseJSON(steps, []);
        const imageUrl = getUploadedImageUrl(req) ?? "";
        const recipeId = await (0, recipeModel_1.createFullRecipe)(title, notes ?? "", imageUrl, parsedMealTypes, parsedIngredients, parsedCategories, parsedSteps);
        await db_1.default.query(`UPDATE recipes
         SET status = 'PENDING',
             created_by = $1,
             approved_by = NULL,
             approved_at = NULL,
             rejection_reason = NULL
       WHERE id = $2`, [userId, recipeId]);
        res.status(201).json({ message: "Návrh receptu přijat (čeká na schválení).", id: recipeId });
    }
    catch (error) {
        res.status(500).json({ error: "Nepodařilo se odeslat návrh receptu.", detail: error.message });
    }
};
exports.submitRecipe = submitRecipe;
const getPendingRecipes = async (_req, res) => {
    try {
        const { rows } = await db_1.default.query(`SELECT r.id, r.title, r.image_url, r.status,
              u.email AS created_by_email
         FROM recipes r
         LEFT JOIN users u ON u.id = r.created_by
        WHERE r.status = 'PENDING'
        ORDER BY r.id DESC`);
        res.status(200).json(rows);
    }
    catch (err) {
        console.error("getPendingRecipes error:", err);
        res.status(500).json({ error: "Chyba při načítání čekajících receptů." });
    }
};
exports.getPendingRecipes = getPendingRecipes;
const approveRecipe = async (req, res) => {
    if (!ensureAdmin(req, res))
        return;
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        res.status(400).json({ error: "Neplatné ID receptu." });
        return;
    }
    try {
        const approverId = req.user.id;
        const result = await db_1.default.query(`UPDATE recipes
          SET status = 'APPROVED',
              approved_by = $1,
              approved_at = NOW(),
              rejection_reason = NULL
        WHERE id = $2`, [approverId, id]);
        if (result.rowCount === 0) {
            res.status(404).json({ error: "Recept nenalezen." });
            return;
        }
        res.status(200).json({ message: "Recept byl schválen." });
    }
    catch {
        res.status(500).json({ error: "Nepodařilo se schválit recept." });
    }
};
exports.approveRecipe = approveRecipe;
const rejectRecipe = async (req, res) => {
    if (!ensureAdmin(req, res))
        return;
    const id = Number(req.params.id);
    const { reason } = req.body;
    if (Number.isNaN(id)) {
        res.status(400).json({ error: "Neplatné ID receptu." });
        return;
    }
    try {
        const result = await db_1.default.query(`UPDATE recipes
          SET status = 'REJECTED',
              rejection_reason = $2,
              approved_by = NULL,
              approved_at = NULL
        WHERE id = $1`, [id, reason ?? null]);
        if (result.rowCount === 0) {
            res.status(404).json({ error: "Recept nenalezen." });
            return;
        }
        res.status(200).json({ message: "Recept byl zamítnut." });
    }
    catch {
        res.status(500).json({ error: "Nepodařilo se zamítnout recept." });
    }
};
exports.rejectRecipe = rejectRecipe;
/** ---------- SUROVINY ---------- **/
const getAllIngredients = async (req, res) => {
    try {
        // volitelné stránkování (default limit 500)
        const limit = Math.min(Number(req.query.limit ?? 500) || 500, 2000);
        const offset = Math.max(Number(req.query.offset ?? 0) || 0, 0);
        const { rows } = await db_1.default.query(`
      SELECT
        id,
        name,
        name_cs,
        category_id,
        unit_name,
        default_grams,
        calories_per_gram,
        off_id,
        energy_kcal_100g, proteins_100g, carbs_100g, sugars_100g,
        fat_100g, saturated_fat_100g, fiber_100g, sodium_100g
      FROM ingredients
      ORDER BY id ASC
      LIMIT $1 OFFSET $2
      `, [limit, offset]);
        res.status(200).json(rows);
    }
    catch (err) {
        console.error("getAllIngredients error:", err);
        res.status(500).json({ error: "Chyba serveru při načítání surovin." });
    }
};
exports.getAllIngredients = getAllIngredients;
const createIngredient = async (req, res) => {
    try {
        if (!ensureAdmin(req, res))
            return;
        const { name, category_id, calories_per_gram, default_grams, unit_name } = req.body;
        if (!name || category_id === undefined || calories_per_gram === undefined) {
            res.status(400).json({ error: "Chybí povinné údaje." });
            return;
        }
        const newIngredient = await (0, recipeModel_1.createIngredientInDB)(name.trim(), Number(calories_per_gram), Number(category_id), default_grams === undefined || default_grams === null || default_grams === "" ? undefined : Number(default_grams), unit_name || undefined);
        res.status(201).json(newIngredient);
    }
    catch (err) {
        if (err?.code === "23505") {
            res.status(409).json({ error: "Surovina s tímto názvem už existuje." });
            return; // ✅ ukončíme bez vracení Response
        }
        res.status(500).json({ error: "Nepodařilo se přidat surovinu." });
    }
};
exports.createIngredient = createIngredient;
const updateIngredient = async (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        res.status(400).json({ error: "Neplatné ID suroviny." });
        return;
    }
    try {
        if (!ensureAdmin(req, res))
            return;
        // povolíme širší payload:
        const { name, name_cs, category_id, calories_per_gram, default_grams, unit_name, off_id, energy_kcal_100g, proteins_100g, carbs_100g, sugars_100g, fat_100g, saturated_fat_100g, fiber_100g, sodium_100g, } = req.body;
        if (name === undefined || category_id === undefined) {
            res.status(400).json({ error: "Chybí povinné údaje (name / category_id)." });
            return;
        }
        const toNum = (v) => v === "" || v === null || v === undefined ? null : Number(v);
        // pokud není zadán calories_per_gram, ale je k dispozici energy_kcal_100g, dopočítej
        const kcalPerGram = calories_per_gram === "" || calories_per_gram == null
            ? (toNum(energy_kcal_100g) != null ? Number(energy_kcal_100g) / 100 : null)
            : Number(calories_per_gram);
        await db_1.default.query(`
      UPDATE ingredients
         SET name                = $2,
             name_cs             = $3,
             category_id         = $4,
             calories_per_gram   = $5,
             default_grams       = $6,
             unit_name           = $7,
             off_id              = $8,
             energy_kcal_100g    = $9,
             proteins_100g       = $10,
             carbs_100g          = $11,
             sugars_100g         = $12,
             fat_100g            = $13,
             saturated_fat_100g  = $14,
             fiber_100g          = $15,
             sodium_100g         = $16
       WHERE id = $1
      `, [
            id,
            String(name).trim(),
            name_cs === "" ? null : (name_cs ?? null),
            Number(category_id),
            kcalPerGram,
            toNum(default_grams),
            unit_name === "" || unit_name === undefined ? null : unit_name,
            off_id === "" ? null : (off_id ?? null),
            toNum(energy_kcal_100g),
            toNum(proteins_100g),
            toNum(carbs_100g),
            toNum(sugars_100g),
            toNum(fat_100g),
            toNum(saturated_fat_100g),
            toNum(fiber_100g),
            toNum(sodium_100g),
        ]);
        res.status(200).json({ message: "Surovina byla úspěšně aktualizována." });
    }
    catch (err) {
        if (err?.code === "23505") {
            res.status(409).json({ error: "Surovina s tímto názvem už existuje." });
            return; // ✅ ukončíme bez vracení Response
        }
        console.error("updateIngredient error:", err);
        res.status(500).json({ error: "Nepodařilo se upravit surovinu." });
    }
};
exports.updateIngredient = updateIngredient;
const deleteIngredient = async (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        res.status(400).json({ error: "Neplatné ID." });
        return;
    }
    try {
        if (!ensureAdmin(req, res))
            return;
        const success = await (0, recipeModel_1.deleteIngredientFromDB)(id);
        if (!success) {
            res.status(404).json({ error: "Surovina nenalezena nebo již smazána." });
            return;
        }
        res.status(200).json({ message: "Surovina smazána." });
    }
    catch (error) {
        console.error("Chyba při mazání suroviny:", error);
        res.status(500).json({ error: "Nepodařilo se smazat surovinu." });
    }
};
exports.deleteIngredient = deleteIngredient;
// --- Hledání v lokálních surovinách (ingredients) pro autocomplete ---
// GET /api/ingredients/search?q=jah&limit=15
async function searchLocalIngredients(req, res) {
    try {
        const qRaw = String(req.query.q ?? "");
        const q = qRaw.trim();
        const limit = Math.min(Number(req.query.limit ?? 15) || 15, 50);
        if (q.length < 2)
            return res.json([]);
        const sql = `
      SELECT
        id,
        name,
        name_cs,
        COALESCE(calories_per_gram, NULLIF(energy_kcal_100g,0)/100.0) AS calories_per_gram,
        default_grams,
        off_id,
        energy_kcal_100g, proteins_100g, carbs_100g, sugars_100g,
        fat_100g, saturated_fat_100g, fiber_100g, sodium_100g
      FROM ingredients
      WHERE lower(name) LIKE lower($1)
         OR lower(name_cs) LIKE lower($1)
      ORDER BY
        CASE
          WHEN lower(name_cs) = lower($2) THEN 0
          WHEN lower(name) = lower($2) THEN 1
          WHEN lower(name_cs) LIKE lower($3) THEN 2
          WHEN lower(name) LIKE lower($3) THEN 3
          ELSE 4
        END,
        COALESCE(name_cs, name) ASC
      LIMIT $4
    `;
        const values = [`%${q}%`, q, `${q}%`, limit];
        const { rows } = await db_1.default.query(sql, values);
        const out = rows.map((r) => ({
            source: "local",
            id: r.id,
            name: r.name,
            name_cs: r.name_cs,
            calories_per_gram: r.calories_per_gram == null ? null : Number(r.calories_per_gram),
            default_grams: r.default_grams == null ? null : Number(r.default_grams),
            brands: null,
            quantity: null,
            image_small_url: null,
            code: String(r.id),
            patch: {
                off_id: r.off_id ?? null,
                energy_kcal_100g: r.energy_kcal_100g == null ? null : Number(r.energy_kcal_100g),
                proteins_100g: r.proteins_100g == null ? null : Number(r.proteins_100g),
                carbs_100g: r.carbs_100g == null ? null : Number(r.carbs_100g),
                sugars_100g: r.sugars_100g == null ? null : Number(r.sugars_100g),
                fat_100g: r.fat_100g == null ? null : Number(r.fat_100g),
                saturated_fat_100g: r.saturated_fat_100g == null ? null : Number(r.saturated_fat_100g),
                fiber_100g: r.fiber_100g == null ? null : Number(r.fiber_100g),
                sodium_100g: r.sodium_100g == null ? null : Number(r.sodium_100g),
            },
        }));
        res.json(out);
    }
    catch (err) {
        console.error("searchLocalIngredients error:", err);
        res.status(500).json({ error: "Search failed" });
    }
}
/** ---------- KATEGORIE ---------- **/
const getAllCategories = async (_req, res) => {
    try {
        const categories = await (0, recipeModel_1.getAllIngredientCategories)();
        res.status(200).json(categories);
    }
    catch {
        res.status(500).json({ error: "Chyba při načítání kategorií." });
    }
};
exports.getAllCategories = getAllCategories;
const createCategory = async (req, res) => {
    try {
        if (!ensureAdmin(req, res))
            return;
        const { name } = req.body;
        if (!name || typeof name !== "string") {
            res.status(400).json({ error: "Název kategorie je povinný." });
            return;
        }
        const newCategory = await (0, recipeModel_1.createIngredientCategory)(name);
        res.status(201).json(newCategory);
    }
    catch {
        res.status(500).json({ error: "Nepodařilo se vytvořit kategorii." });
    }
};
exports.createCategory = createCategory;
const updateCategory = async (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        res.status(400).json({ error: "Neplatné ID." });
        return;
    }
    try {
        if (!ensureAdmin(req, res))
            return;
        const { name } = req.body;
        if (!name || typeof name !== "string") {
            res.status(400).json({ error: "Název kategorie je povinný." });
            return;
        }
        await (0, recipeModel_1.updateIngredientCategory)(id, name);
        res.status(200).json({ message: "Kategorie upravena." });
    }
    catch {
        res.status(500).json({ error: "Nepodařilo se upravit kategorii." });
    }
};
exports.updateCategory = updateCategory;
const deleteCategory = async (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        res.status(400).json({ error: "Neplatné ID." });
        return;
    }
    try {
        if (!ensureAdmin(req, res))
            return;
        await (0, recipeModel_1.deleteIngredientCategory)(id);
        res.status(200).json({ message: "Kategorie smazána." });
    }
    catch {
        res.status(500).json({ error: "Nepodařilo se smazat kategorii." });
    }
};
exports.deleteCategory = deleteCategory;
