import { Router, Request, Response } from "express";
import {
  getAllIngredientsFromDB,
  createIngredientInDB,
  updateIngredientInDB,
  deleteIngredientFromDB,
  getAllIngredientCategories,
} from "../models/recipeModel";
import db from "../utils/db";

const router = Router();

/**
 * GET /api/ingredients
 */
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    console.log("📥 [GET] /api/ingredients zavolán");
    const ingredients = await getAllIngredientsFromDB();
    console.log("📦 Načtené suroviny z DB:", ingredients);

    const transformed = ingredients.map((i) => ({
      id: i.id,
      name: i.name,
      calories_per_gram: i.calories_per_gram,
      category: i.category_name,
    }));

    console.log("✅ Vrácená data:", transformed);
    res.status(200).json(transformed);
  } catch (err) {
    console.error("❌ Chyba při načítání surovin:", err);
    res.status(500).json({ error: "Chyba serveru při načítání surovin" });
  }
});

/**
 * GET /api/ingredients/categories
 */
router.get("/categories", async (_req: Request, res: Response): Promise<void> => {
  try {
    console.log("📥 [GET] /api/ingredients/categories zavolán");
    const categories = await getAllIngredientCategories();
    console.log("📦 Kategorie z DB:", categories);
    res.status(200).json(categories);
  } catch (err) {
    console.error("❌ Chyba při načítání kategorií surovin:", err);
    res.status(500).json({ error: "Chyba serveru při načítání kategorií" });
  }
});

/**
 * POST /api/ingredients
 */
router.post("/", async (req: Request, res: Response): Promise<void> => {
  console.log("📥 [POST] /api/ingredients zavolán s daty:", req.body);

  const { name, category, calories_per_gram } = req.body;

  if (
    typeof name !== "string" ||
    typeof category !== "string" ||
    typeof calories_per_gram !== "number"
  ) {
    console.warn("⚠️ Neplatný vstup:", req.body);
    res.status(400).json({ error: "Neplatný vstup – očekávám jméno, kategorii (název) a kalorie jako číslo." });
    return;
  }

  try {
    const result = await db.query("SELECT id FROM ingredient_categories WHERE name = $1", [category]);
    const category_id = result.rows[0]?.id;

    if (!category_id) {
      console.warn("⚠️ Kategorie nenalezena:", category);
      res.status(400).json({ error: `Kategorie '${category}' neexistuje.` });
      return;
    }

    const newIngredient = await createIngredientInDB(name, calories_per_gram, category_id);
    console.log("✅ Nová surovina vytvořena:", newIngredient);

    res.status(201).json({
      ...newIngredient,
      category,
    });
  } catch (err) {
    console.error("❌ Chyba při vytváření suroviny:", err);
    res.status(500).json({ error: "Chyba serveru při vytváření suroviny" });
  }
});

/**
 * PUT /api/ingredients/:id
 */
router.put("/:id", async (req: Request, res: Response): Promise<void> => {
  console.log("📥 [PUT] /api/ingredients/:id zavolán:", req.params.id, req.body);

  const id = Number(req.params.id);
  const { name, category, calories_per_gram } = req.body;

  if (
    isNaN(id) ||
    typeof name !== "string" ||
    typeof category !== "string" ||
    typeof calories_per_gram !== "number"
  ) {
    console.warn("⚠️ Neplatné vstupní údaje:", req.body);
    res.status(400).json({ error: "Neplatný vstup – zkontroluj ID a vstupní hodnoty." });
    return;
  }

  try {
    const result = await db.query("SELECT id FROM ingredient_categories WHERE name = $1", [category]);
    const category_id = result.rows[0]?.id;

    if (!category_id) {
      console.warn("⚠️ Kategorie nenalezena:", category);
      res.status(400).json({ error: `Kategorie '${category}' neexistuje.` });
      return;
    }

    await updateIngredientInDB(id, name, calories_per_gram, category_id);
    console.log("✅ Surovina úspěšně aktualizována:", id);
    res.status(200).json({ message: "✅ Surovina byla úspěšně aktualizována." });
  } catch (err) {
    console.error("❌ Chyba při aktualizaci suroviny:", err);
    res.status(500).json({ error: "Chyba serveru při aktualizaci suroviny" });
  }
});

/**
 * DELETE /api/ingredients/:id
 */
router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  console.log("📥 [DELETE] /api/ingredients/:id zavolán:", req.params.id);

  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Neplatné ID – očekávám číselné ID." });
    return;
  }

  try {
    await deleteIngredientFromDB(id);
    console.log("🗑️ Surovina smazána:", id);
    res.status(200).json({ message: "✅ Surovina byla úspěšně smazána." });
  } catch (err) {
    console.error("❌ Chyba při mazání suroviny:", err);
    res.status(500).json({ error: "Chyba serveru při mazání suroviny" });
  }
});

export default router;