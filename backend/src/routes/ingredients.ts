import { Router, Request, Response } from "express";
import {
  getAllIngredientsFromDB,
  createIngredientInDB,
  updateIngredientInDB,
  deleteIngredientFromDB,
  getAllIngredientCategories,
  createIngredientCategory,
  updateIngredientCategory,
  deleteIngredientCategory,
} from "../models/recipeModel";
import db from "../utils/db";

const router = Router();

// ==============================
// ✅ INGREDIENTS
// ==============================

router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const ingredients = await getAllIngredientsFromDB();
    const transformed = ingredients.map((i) => ({
      id: i.id,
      name: i.name,
      calories_per_gram: i.calories_per_gram,
      category: i.category_name,
    }));
    res.status(200).json(transformed);
  } catch (err) {
    console.error("❌ Chyba při načítání surovin:", err);
    res.status(500).json({ error: "Chyba serveru při načítání surovin" });
  }
});

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const { name, category, calories_per_gram } = req.body;
  if (typeof name !== "string" || typeof category !== "string" || typeof calories_per_gram !== "number") {
    res.status(400).json({ error: "Neplatný vstup." });
    return;
  }

  try {
    const result = await db.query("SELECT id FROM ingredient_categories WHERE name = $1", [category]);
    const category_id = result.rows[0]?.id;
    if (!category_id) {
      res.status(400).json({ error: `Kategorie '${category}' neexistuje.` });
      return;
    }
    const newIngredient = await createIngredientInDB(name, calories_per_gram, category_id);
    res.status(201).json({ ...newIngredient, category });
  } catch (err) {
    console.error("❌ Chyba při vytváření suroviny:", err);
    res.status(500).json({ error: "Chyba serveru při vytváření suroviny" });
  }
});

router.put("/:id", async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  const { name, category, calories_per_gram } = req.body;
  if (isNaN(id) || typeof name !== "string" || typeof category !== "string" || typeof calories_per_gram !== "number") {
    res.status(400).json({ error: "Neplatný vstup." });
    return;
  }

  try {
    const result = await db.query("SELECT id FROM ingredient_categories WHERE name = $1", [category]);
    const category_id = result.rows[0]?.id;
    if (!category_id) {
      res.status(400).json({ error: `Kategorie '${category}' neexistuje.` });
      return;
    }
    await updateIngredientInDB(id, name, calories_per_gram, category_id);
    res.status(200).json({ message: "✅ Surovina byla úspěšně aktualizována." });
  } catch (err) {
    console.error("❌ Chyba při aktualizaci suroviny:", err);
    res.status(500).json({ error: "Chyba serveru při aktualizaci suroviny" });
  }
});

router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Neplatné ID." });
    return;
  }

  try {
    await deleteIngredientFromDB(id);
    res.status(200).json({ message: "✅ Surovina byla úspěšně smazána." });
  } catch (err) {
    console.error("❌ Chyba při mazání suroviny:", err);
    res.status(500).json({ error: "Chyba serveru při mazání suroviny" });
  }
});

// ==============================
// ✅ INGREDIENT CATEGORIES
// ==============================

router.get("/categories", async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await getAllIngredientCategories();
    res.status(200).json(categories);
  } catch (err) {
    console.error("❌ Chyba při načítání kategorií:", err);
    res.status(500).json({ error: "Chyba serveru při načítání kategorií" });
  }
});

router.post("/categories", async (req: Request, res: Response): Promise<void> => {
  const { name } = req.body;
  if (typeof name !== "string" || name.trim() === "") {
    res.status(400).json({ error: "Neplatný název kategorie." });
    return;
  }

  try {
    const category = await createIngredientCategory(name.trim());
    res.status(201).json(category);
  } catch (err) {
    console.error("❌ Chyba při vytváření kategorie:", err);
    res.status(500).json({ error: "Chyba serveru při vytváření kategorie" });
  }
});

router.put("/categories/:id", async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  const { name } = req.body;
  if (isNaN(id) || typeof name !== "string" || name.trim() === "") {
    res.status(400).json({ error: "Neplatné vstupní údaje." });
    return;
  }

  try {
    await updateIngredientCategory(id, name.trim());
    res.status(200).json({ message: "Kategorie aktualizována." });
  } catch (err) {
    console.error("❌ Chyba při aktualizaci kategorie:", err);
    res.status(500).json({ error: "Chyba serveru při aktualizaci kategorie." });
  }
});

router.delete("/categories/:id", async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Neplatné ID kategorie." });
    return;
  }

  try {
    await deleteIngredientCategory(id);
    res.status(200).json({ message: "Kategorie byla smazána." });
  } catch (err) {
    console.error("❌ Chyba při mazání kategorie:", err);
    res.status(500).json({ error: "Chyba serveru při mazání kategorie." });
  }
});

export default router;