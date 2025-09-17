// 📁 backend/src/controllers/recipeController.ts
import type { Request, Response } from "express";
import db from "../utils/db";
import {
  getAllRecipes,
  getRecipeByIdFromDB,
  createFullRecipe,
  updateRecipeInDB,
  deleteRecipeFromDB,
  getAllIngredientsFromDB,
  createIngredientInDB,
  updateIngredientInDB,
  deleteIngredientFromDB,
  getAllIngredientCategories,
  createIngredientCategory,
  updateIngredientCategory,
  deleteIngredientCategory,
  type IngredientInput as ModelIngredientInput,
} from "../models/recipeModel";

type Role = "SUPERADMIN" | "ADMIN" | "USER";

function ensureAdmin(req: Request, res: Response): boolean {
  const role = req.user?.role as Role | undefined;
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

function ensureLoggedIn(req: Request, res: Response): number | null {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Nejste přihlášen." });
    return null;
  }
  return userId;
}

function parseJSON<T>(value: unknown, fallback: T): T {
  if (typeof value === "string" && value.trim() !== "") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return (value as T) ?? fallback;
}

/** ✅ Parser předvoleb porcí: [{label:string, grams:number}, ...] */
function parseServingPresets(input: unknown): {
  label: string;
  grams: number;
  unit?: string;
  inflect?: { one?: string; few?: string; many?: string };
}[] {
  const raw =
    typeof input === "string"
      ? (() => { try { return JSON.parse(input); } catch { return []; } })()
      : input;

  if (!Array.isArray(raw)) return [];
  return raw
    .map((x: any) => ({
      label: String(x?.label ?? x?.path ?? "").trim(),
      grams: Number(x?.grams ?? x?.g ?? NaN),
      unit:  x?.unit ? String(x.unit) : "ks",
      inflect: x?.inflect ? {
        one:  x.inflect.one  ?? undefined,
        few:  x.inflect.few  ?? undefined,
        many: x.inflect.many ?? undefined,
      } : undefined,
    }))
    .filter((x) => x.label && Number.isFinite(x.grams) && x.grams > 0);
}

/** ====== PŮVODNÍ JSON parser (ponechán jako fallback) ====== */
function processIngredients(raw: unknown): ModelIngredientInput[] {
  let arr: unknown;
  if (typeof raw === "string") {
    try {
      arr = JSON.parse(raw);
    } catch {
      throw new Error("Chybný formát ingrediencí.");
    }
  } else {
    arr = raw;
  }
  if (!Array.isArray(arr)) throw new Error("Ingredience nejsou ve správném formátu.");

  return (arr as any[]).map((i) => {
    const ingredient_id =
      i.ingredient_id !== undefined ? Number(i.ingredient_id)
      : i.id !== undefined ? Number(i.id)
      : 0;

    const base: any = {
      ingredient_id,
      amount: Number(i.amount ?? 0),
      unit: String(i.unit ?? ""),
      calories_per_gram: Number(i.calories_per_gram ?? 0),
    };

    if (i.category_id !== undefined) base.category_id = Number(i.category_id);
    if (i.category_name !== undefined) base.category_name = String(i.category_name);
    if (i.default_grams !== undefined && i.default_grams !== null && i.default_grams !== "")
      base.default_grams = Number(i.default_grams);
    if (i.display !== undefined) base.display = String(i.display);
    if (i.name !== undefined) base.name = String(i.name);

    // OFF ID + makra (pokud dorazí přes JSON)
    if (i.off_id !== undefined) base.off_id = String(i.off_id);
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

    // volitelné – pokud JSON obsahoval vybraný preset
    if (i.selectedServingGrams !== undefined && i.selectedServingGrams !== null && i.selectedServingGrams !== "") {
      base.selectedServingGrams = Number(i.selectedServingGrams);
    }

    return base as ModelIngredientInput;
  });
}

/** ====== NOVÝ parser pro rozbalené FormData: ingredients[0][...] ====== */
/** lokální typ pro sběr z FormData – rozšiřuje model o optional selectedServingGrams,
 * aby TS nehlásil chybu na Partial<ModelIngredientInput>.
 */
type CollectedIng = Partial<ModelIngredientInput> & {
  selectedServingGrams?: number | null;
};

function collectIngredientsFromBody(body: any): ModelIngredientInput[] {
  // Fallback – když někdo pošle JSON celé pole v "ingredients"
  if (body.ingredients && (typeof body.ingredients === "string" || Array.isArray(body.ingredients))) {
    return processIngredients(body.ingredients);
  }

  const byIndex: Record<string, CollectedIng> = {};

  for (const rawKey of Object.keys(body)) {
    const m = rawKey.match(/^ingredients\[(\d+)\]\[(.+)\]$/);
    if (!m) continue;
    const [, idx, field] = m;
    if (!byIndex[idx]) byIndex[idx] = {};

    const v = body[rawKey];

    if (
      [
        "amount",
        "calories_per_gram",
        "default_grams",
        "selectedServingGrams",
        "energy_kcal_100g",
        "proteins_100g",
        "carbs_100g",
        "sugars_100g",
        "fat_100g",
        "saturated_fat_100g",
        "fiber_100g",
        "sodium_100g",
      ].includes(field)
    ) {
      (byIndex[idx] as any)[field] = v === "" || v == null ? null : Number(v);
      continue;
    }

    if (["name", "unit", "display", "off_id"].includes(field)) {
      (byIndex[idx] as any)[field] = v ?? "";
      continue;
    }
  }

  const out: ModelIngredientInput[] = Object.values(byIndex).map((r) => ({
    name: String(r.name ?? ""),
    amount: Number(r.amount ?? 0),
    unit: String(r.unit ?? "g"),
    calories_per_gram: Number(r.calories_per_gram ?? 0),
    display: r.display == null || r.display === "" ? undefined : String(r.display),
    default_grams: r.default_grams === null || r.default_grams === undefined ? null : Number(r.default_grams),
    selectedServingGrams: r.selectedServingGrams == null ? null : Number(r.selectedServingGrams),
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

function getUploadedImageUrl(req: Request): string | null {
  const file = req.file as (Express.Multer.File & { secure_url?: string; path?: string }) | undefined;
  return file?.secure_url || file?.path || null;
}

/** ---------- RECEPTY ---------- **/

export const getRecipes = async (_req: Request, res: Response): Promise<void> => {
  try {
    const all = (await getAllRecipes()) as any[];
    const onlyApproved = all.filter((r) => (r.status ?? "APPROVED") === "APPROVED");
    res.status(200).json(onlyApproved);
  } catch (err) {
    console.error("getRecipes error:", err);
    res.status(500).json({ error: "Chyba při načítání receptů." });
  }
};

export const getRecipeById = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Neplatné ID receptu." });
    return;
  }
  try {
    const recipe = (await getRecipeByIdFromDB(id)) as any | null;
    if (!recipe) {
      res.status(404).json({ error: "Recept nenalezen." });
      return;
    }

    const status = recipe.status ?? "APPROVED";
    if (status !== "APPROVED") {
      const role = req.user?.role as Role | undefined;
      const userId = req.user?.id as number | undefined;
      const isModerator = role === "ADMIN" || role === "SUPERADMIN";
      const isAuthor = userId && recipe.created_by && Number(recipe.created_by) === Number(userId);
      if (!isModerator && !isAuthor) {
        res.status(404).json({ error: "Recept nenalezen." });
        return;
      }
    }

    res.status(200).json(recipe);
  } catch (err) {
    console.error("getRecipeById error:", err);
    res.status(500).json({ error: "Chyba serveru při načítání receptu." });
  }
};

export const addRecipe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!ensureAdmin(req, res)) return;

    const { title, notes, categories, mealTypes, steps } = req.body as any;

    const parsedIngredients = collectIngredientsFromBody(req.body);
    if (!title || parsedIngredients.length === 0) {
      res.status(400).json({ error: "Chybí povinná pole (title/ingredients)." });
      return;
    }

    const parsedCategories = parseJSON<string[]>(categories, []);
    const parsedMealTypes = parseJSON<string[]>(mealTypes, []);
    const parsedSteps = parseJSON<string[]>(steps, []);
    const imageUrl = getUploadedImageUrl(req) ?? "";

    const recipeId = await createFullRecipe(
      title,
      notes ?? "",
      imageUrl,
      parsedMealTypes,
      parsedIngredients,
      parsedCategories,
      parsedSteps
    );

    res.status(201).json({ message: "Recept uložen.", id: recipeId });
  } catch (error) {
    console.error("addRecipe error:", error);
    res.status(500).json({ error: "Nepodařilo se uložit recept.", detail: (error as Error).message });
  }
};

export const updateRecipe = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Neplatné ID receptu." });
    return;
  }

  try {
    if (!ensureAdmin(req, res)) return;

    const { title, notes, categories, mealTypes, steps, existingImageUrl } = req.body as any;

    const parsedIngredients = collectIngredientsFromBody(req.body);
    if (!title || parsedIngredients.length === 0) {
      res.status(400).json({ error: "Chybí povinná pole (title/ingredients)." });
      return;
    }

    const parsedCategories = parseJSON<string[]>(categories, []);
    const parsedMealTypes = parseJSON<string[]>(mealTypes, []);
    const parsedSteps = parseJSON<string[]>(steps, []);
    const uploadedUrl = getUploadedImageUrl(req);
    const finalImageUrl = uploadedUrl ?? (existingImageUrl || null);

    await updateRecipeInDB(
      id,
      title,
      notes ?? "",
      finalImageUrl,
      parsedMealTypes,
      parsedIngredients,
      parsedCategories,
      parsedSteps
    );
    res.status(200).json({ message: "Recept úspěšně upraven." });
  } catch (error) {
    console.error("updateRecipe error:", error);
    res.status(500).json({ error: "Nepodařilo se upravit recept.", detail: (error as Error).message });
  }
};

export const deleteRecipe = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Neplatné ID." });
    return;
  }
  try {
    if (!ensureAdmin(req, res)) return;
    await deleteRecipeFromDB(id);
    res.status(200).json({ message: "Recept smazán." });
  } catch {
    res.status(500).json({ error: "Nepodařilo se smazat recept." });
  }
};

/** ---------- Moderace ---------- **/
export const submitRecipe = async (req: Request, res: Response): Promise<void> => {
  const userId = ensureLoggedIn(req, res);
  if (!userId) return;

  try {
    const { title, notes, categories, mealTypes, steps } = req.body as any;

    const parsedIngredients = collectIngredientsFromBody(req.body);
    if (!title || parsedIngredients.length === 0) {
      res.status(400).json({ error: "Chybí povinná pole (title/ingredients)." });
      return;
    }

    const parsedCategories = parseJSON<string[]>(categories, []);
    const parsedMealTypes = parseJSON<string[]>(mealTypes, []);
    const parsedSteps = parseJSON<string[]>(steps, []);
    const imageUrl = getUploadedImageUrl(req) ?? "";

    const recipeId = await createFullRecipe(
      title,
      notes ?? "",
      imageUrl,
      parsedMealTypes,
      parsedIngredients,
      parsedCategories,
      parsedSteps
    );

    await db.query(
      `UPDATE recipes
         SET status = 'PENDING',
             created_by = $1,
             approved_by = NULL,
             approved_at = NULL,
             rejection_reason = NULL
       WHERE id = $2`,
      [userId, recipeId]
    );

    res.status(201).json({ message: "Návrh receptu přijat (čeká na schválení).", id: recipeId });
  } catch (error) {
    res.status(500).json({ error: "Nepodařilo se odeslat návrh receptu.", detail: (error as Error).message });
  }
};

export const getPendingRecipes = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { rows } = await db.query(
      `SELECT r.id, r.title, r.image_url, r.status,
              u.email AS created_by_email
         FROM recipes r
         LEFT JOIN users u ON u.id = r.created_by
        WHERE r.status = 'PENDING'
        ORDER BY r.id DESC`
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error("getPendingRecipes error:", err);
    res.status(500).json({ error: "Chyba při načítání čekajících receptů." });
  }
};

export const approveRecipe = async (req: Request, res: Response): Promise<void> => {
  if (!ensureAdmin(req, res)) return;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Neplatné ID receptu." });
    return;
  }
  try {
    const approverId = req.user!.id;
    const result = await db.query(
      `UPDATE recipes
          SET status = 'APPROVED',
              approved_by = $1,
              approved_at = NOW(),
              rejection_reason = NULL
        WHERE id = $2`,
      [approverId, id]
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: "Recept nenalezen." });
      return;
    }
    res.status(200).json({ message: "Recept byl schválen." });
  } catch {
    res.status(500).json({ error: "Nepodařilo se schválit recept." });
  }
};

export const rejectRecipe = async (req: Request, res: Response): Promise<void> => {
  if (!ensureAdmin(req, res)) return;
  const id = Number(req.params.id);
  const { reason } = req.body as { reason?: string };
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Neplatné ID receptu." });
    return;
  }
  try {
    const result = await db.query(
      `UPDATE recipes
          SET status = 'REJECTED',
              rejection_reason = $2,
              approved_by = NULL,
              approved_at = NULL
        WHERE id = $1`,
      [id, reason ?? null]
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: "Recept nenalezen." });
      return;
    }
    res.status(200).json({ message: "Recept byl zamítnut." });
  } catch {
    res.status(500).json({ error: "Nepodařilo se zamítnout recept." });
  }
};

/** ---------- SUROVINY ---------- **/
export const getAllIngredients = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = Math.min(Number(req.query.limit ?? 500) || 500, 2000);
    const offset = Math.max(Number(req.query.offset ?? 0) || 0, 0);

    const { rows } = await db.query(
      `
      SELECT
        id,
        name,
        name_cs,
        name_genitive,
        category_id,
        unit_name,
        default_grams,
        calories_per_gram,
        off_id,
        energy_kcal_100g, proteins_100g, carbs_100g, sugars_100g,
        fat_100g, saturated_fat_100g, fiber_100g, sodium_100g,
        serving_presets
      FROM ingredients
      ORDER BY id ASC
      LIMIT $1 OFFSET $2
      `,
      [limit, offset]
    );

    res.status(200).json(rows);
  } catch (err) {
    console.error("getAllIngredients error:", err);
    res.status(500).json({ error: "Chyba serveru při načítání surovin." });
  }
};

export async function createIngredient(req: Request, res: Response) {
  try {
    const b = req.body ?? {};
    const servingPresets = Array.isArray(b.serving_presets) ? b.serving_presets : [];

    const { rows } = await db.query(
      `
      INSERT INTO public.ingredients (
        name, name_cs, name_genitive, unit_name, category_id, default_grams,
        calories_per_gram,
        energy_kcal_100g, proteins_100g, carbs_100g, sugars_100g, fat_100g, saturated_fat_100g,
        fiber_100g, sodium_100g,
        trans_fat_100g, mono_fat_100g, poly_fat_100g, cholesterol_mg_100g,
        salt_100g, calcium_mg_100g, water_100g, phe_mg_100g,
        serving_presets
      ) VALUES (
        $1,$2,$3,$4,$5,$6,
        $7,
        $8,$9,$10,$11,$12,$13,
        $14,$15,
        $16,$17,$18,$19,
        $20,$21,$22,$23,
        $24::jsonb
      ) RETURNING *;
      `,
      [
        b.name ?? null, b.name_cs ?? null, b.name_genitive ?? null, b.unit_name ?? null,
        b.category_id ?? null, b.default_grams ?? null,
        b.calories_per_gram ?? null,
        b.energy_kcal_100g ?? null, b.proteins_100g ?? null, b.carbs_100g ?? null, b.sugars_100g ?? null, b.fat_100g ?? null, b.saturated_fat_100g ?? null,
        b.fiber_100g ?? null, b.sodium_100g ?? null,
        b.trans_fat_100g ?? null, b.mono_fat_100g ?? null, b.poly_fat_100g ?? null, b.cholesterol_mg_100g ?? null,
        b.salt_100g ?? null, b.calcium_mg_100g ?? null, b.water_100g ?? null, b.phe_mg_100g ?? null,
        JSON.stringify(servingPresets),
      ]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Create failed" });
  }
}

export async function updateIngredient(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const b = req.body ?? {};

    // JSON pole ošetřit na jsonb
    const servingPresets = Array.isArray(b.serving_presets) ? b.serving_presets : [];

    const { rows } = await db.query(
      `
      UPDATE public.ingredients SET
        name=$1,
        name_cs=$2,
        name_genitive=$3,
        unit_name=$4,
        category_id=$5,
        default_grams=$6,
        calories_per_gram=$7,

        energy_kcal_100g=$8,
        proteins_100g=$9,
        carbs_100g=$10,
        sugars_100g=$11,
        fat_100g=$12,
        saturated_fat_100g=$13,
        fiber_100g=$14,
        sodium_100g=$15,

        trans_fat_100g=$16,
        mono_fat_100g=$17,
        poly_fat_100g=$18,
        cholesterol_mg_100g=$19,

        salt_100g=$20,
        calcium_mg_100g=$21,
        water_100g=$22,
        phe_mg_100g=$23,

        serving_presets=$24::jsonb
      WHERE id=$25
      RETURNING *;
      `,
      [
        b.name ?? null,
        b.name_cs ?? null,
        b.name_genitive ?? null,
        b.unit_name ?? null,
        b.category_id ?? null,
        b.default_grams ?? null,
        b.calories_per_gram ?? null,

        b.energy_kcal_100g ?? null,
        b.proteins_100g ?? null,
        b.carbs_100g ?? null,
        b.sugars_100g ?? null,
        b.fat_100g ?? null,
        b.saturated_fat_100g ?? null,
        b.fiber_100g ?? null,
        b.sodium_100g ?? null,

        b.trans_fat_100g ?? null,
        b.mono_fat_100g ?? null,
        b.poly_fat_100g ?? null,
        b.cholesterol_mg_100g ?? null,

        b.salt_100g ?? null,
        b.calcium_mg_100g ?? null,
        b.water_100g ?? null,
        b.phe_mg_100g ?? null,

        JSON.stringify(servingPresets),
        id,
      ]
    );

    if (!rows[0]) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Update failed" });
  }
}

export const deleteIngredient = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Neplatné ID." });
    return;
  }

  try {
    if (!ensureAdmin(req, res)) return;

    const success = await deleteIngredientFromDB(id);
    if (!success) {
      res.status(404).json({ error: "Surovina nenalezena nebo již smazána." });
      return;
    }

    res.status(200).json({ message: "Surovina smazána." });
  } catch (error) {
    console.error("Chyba při mazání suroviny:", error);
    res.status(500).json({ error: "Nepodařilo se smazat surovinu." });
  }
};


export async function searchLocalIngredients(req: Request, res: Response) {
  try {
    const q = String(req.query.q ?? "").toLowerCase();
    const limit = Math.min(Number(req.query.limit ?? 50), 200);
    const format = String(req.query.format ?? "compact");

    const colsCompact = `
      id, name, name_cs, category_id, default_grams, unit_name,
      energy_kcal_100g, proteins_100g, carbs_100g, sugars_100g, fat_100g
    `;

    const colsFull = `
      id, name, name_cs, name_genitive, category_id, default_grams, unit_name,
      calories_per_gram,
      energy_kcal_100g, proteins_100g, carbs_100g, sugars_100g, fat_100g, saturated_fat_100g,
      fiber_100g, sodium_100g,
      trans_fat_100g, mono_fat_100g, poly_fat_100g, cholesterol_mg_100g,
      salt_100g, calcium_mg_100g, water_100g, phe_mg_100g,
      serving_presets
    `;

    const cols = format === "full" ? colsFull : colsCompact;

    const { rows } = await db.query(
      `
      SELECT ${cols}
      FROM public.ingredients
      WHERE lower(coalesce(name_cs, name)) LIKE $1
      ORDER BY name_cs NULLS LAST, name
      LIMIT $2
      `,
      [`%${q}%`, limit]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Search failed" });
  }
}

/** ---------- KATEGORIE ---------- **/
export const getAllCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await getAllIngredientCategories();
    res.status(200).json(categories);
  } catch {
    res.status(500).json({ error: "Chyba při načítání kategorií." });
  }
};

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!ensureAdmin(req, res)) return;

    const { name } = req.body as { name?: string };
    if (!name || typeof name !== "string") {
      res.status(400).json({ error: "Název kategorie je povinný." });
      return;
    }

    const newCategory = await createIngredientCategory(name);
    res.status(201).json(newCategory);
  } catch {
    res.status(500).json({ error: "Nepodařilo se vytvořit kategorii." });
  }
};

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Neplatné ID." });
    return;
  }
  try {
    if (!ensureAdmin(req, res)) return;

    const { name } = req.body as { name?: string };
    if (!name || typeof name !== "string") {
      res.status(400).json({ error: "Název kategorie je povinný." });
      return;
    }

    await updateIngredientCategory(id, name);
    res.status(200).json({ message: "Kategorie upravena." });
  } catch {
    res.status(500).json({ error: "Nepodařilo se upravit kategorii." });
  }
};

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Neplatné ID." });
    return;
  }
  try {
    if (!ensureAdmin(req, res)) return;

    await deleteIngredientCategory(id);
    res.status(200).json({ message: "Kategorie smazána." });
  } catch {
    res.status(500).json({ error: "Nepodařilo se smazat kategorii." });
  }
};