import express from "express";
import { authenticateToken, requireRole } from "../middleware/auth";
import db from "../utils/db";
import {
  // suroviny
  getAllIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,

  // kategorie
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,

  // vyhledávání
  searchLocalIngredients,
} from "../controllers/recipeController";

const router = express.Router();

/* ───────────────────── STATICKÉ / SPECIFICKÉ CESTY NEJDŘÍV ───────────────────── */

// --- ROUTY PRO KATEGORIE SUROVIN ---
router.get("/categories", getAllCategories);
router.post("/categories", authenticateToken, requireRole("ADMIN", "SUPERADMIN"), createCategory);
router.put("/categories/:id", authenticateToken, requireRole("ADMIN", "SUPERADMIN"), updateCategory);
router.delete("/categories/:id", authenticateToken, requireRole("ADMIN", "SUPERADMIN"), deleteCategory);

// --- VYHLEDÁVÁNÍ ---
router.get("/search", searchLocalIngredients);

// --- RESOLVE PODLE NÁZVU (pro modal) ---
// GET /api/ingredients/resolve?name=...
router.get("/resolve", async (req, res) => {
  const name = String(req.query.name ?? "").trim();
  if (!name) return res.status(400).json({ message: "Missing ?name" });

  try {
    const sql = `
      SELECT id, name, name_cs
      FROM public.ingredients
      WHERE lower(name) = lower($1)
         OR lower(name_cs) = lower($1)
      ORDER BY id
      LIMIT 1;
    `;
    const r = await db.query(sql, [name]);
    if (!r.rows.length) return res.status(404).json({ message: "Not found" });
    return res.json(r.rows[0]);
  } catch (e) {
    console.error("GET /ingredients/resolve error:", e);
    return res.status(500).json({ message: "Server error" });
  }
});

/* ───────────────────────── OBECNÉ CESTY AŽ POTOM ───────────────────────── */

// --- SEZNAM / VYTVOŘENÍ ---
router.get("/", getAllIngredients);
router.post("/", authenticateToken, requireRole("ADMIN", "SUPERADMIN"), createIngredient);

// --- DETAIL SUROVINY (plné makra pro modal) ---
// GET /api/ingredients/:id?format=full
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ message: "Bad id" });

  try {
    const sql = `
      SELECT
        id,
        name,
        name_cs,
        name_genitive,
        -- důležité pro výpočet porcí v modalu
        default_grams,
        unit_name,
        -- výživa na 100 g
        energy_kcal_100g,
        proteins_100g,
        carbs_100g,
        sugars_100g,
        fat_100g,
        saturated_fat_100g,
        fiber_100g,
        sodium_100g,
        salt_100g,
        calcium_mg_100g,
        water_100g,
        phe_mg_100g,
        -- rozšířené položky
        trans_fat_100g,
        mono_fat_100g,
        poly_fat_100g,
        cholesterol_mg_100g,
        -- presety porcí (✅ jsonb fallback musí být jsonb)
        COALESCE(serving_presets, '[]'::jsonb) AS serving_presets
      FROM public.ingredients
      WHERE id = $1
      LIMIT 1;
    `;
    const r = await db.query(sql, [id]);
    if (!r.rows.length) return res.status(404).json({ message: "Not found" });

    // Volitelně přidej camelCase mirror, ať FE nemusí řešit snake vs camel
    const row = r.rows[0];
    const presets = Array.isArray(row.serving_presets) ? row.serving_presets : [];
    const servingPresets = presets.map((p: any) => ({
      label: String(p?.label ?? p?.path ?? ""),
      grams: Number(p?.grams ?? p?.g ?? 0) || 0,
      unit: p?.unit ?? "ks",
      inflect: p?.inflect
        ? { one: p.inflect.one ?? undefined, few: p.inflect.few ?? undefined, many: p.inflect.many ?? undefined }
        : undefined,
    }));

    return res.json({ ...row, servingPresets });
  } catch (e) {
    console.error("GET /ingredients/:id error:", e);
    return res.status(500).json({ message: "Server error" });
  }
});

// --- UPDATE / DELETE ---
router.put("/:id", authenticateToken, requireRole("ADMIN", "SUPERADMIN"), updateIngredient);
router.delete("/:id", authenticateToken, requireRole("ADMIN", "SUPERADMIN"), deleteIngredient);

export default router;