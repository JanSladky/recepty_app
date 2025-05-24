import { Router, Request, Response } from "express";
import {
  getAllIngredientsFromDB,
  createIngredientInDB,
  updateIngredientInDB,
  deleteIngredientFromDB,
  getAllIngredientCategories,
  createIngredientCategory,
  updateIngredientCategory,
} from "../models/recipeModel";
import db from "../utils/db";

const router = Router();

// ==============================
// ✅ INGREDIENTS
// ==============================

router.get("/", async (_req: Request, res: Response) => {
  try {
    const ingredients = await getAllIngredientsFromDB();
    const transformed = ingredients.map((i) => ({
      id: i.id,
      name: i.name,
      calories_per_gram: i.calories_per_gram,
      category_id: i.category_id,
      category_name: i.category_name,
    }));
    res.status(200).json(transformed);
  } catch (err) {
    console.error("❌ Chyba při načítání surovin:", err);
    res.status(500).json({ error: "Chyba serveru při načítání surovin" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  const { name, category_id, calories_per_gram } = req.body;
  if (typeof name !== "string" || typeof category_id !== "number" || typeof calories_per_gram !== "number") {
    res.status(400).json({ error: "Neplatný vstup." });
    return;
  }

  try {
    const result = await db.query("SELECT id FROM ingredient_categories WHERE id = $1", [category_id]);
    if (result.rows.length === 0) {
      res.status(400).json({ error: "Zvolená kategorie neexistuje." });
      return;
    }

    const newIngredient = await createIngredientInDB(name.trim(), calories_per_gram, category_id);
    res.status(201).json(newIngredient);
  } catch (err) {
    console.error("❌ Chyba při vytváření suroviny:", err);
    res.status(500).json({ error: "Chyba serveru při vytváření suroviny" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { name, category_id, calories_per_gram } = req.body;

  if (
    isNaN(id) ||
    typeof name !== "string" ||
    typeof category_id !== "number" ||
    typeof calories_per_gram !== "number"
  ) {
    res.status(400).json({ error: "Neplatný vstup." });
    return;
  }

  try {
    const categoryCheck = await db.query("SELECT id FROM ingredient_categories WHERE id = $1", [category_id]);
    if (categoryCheck.rows.length === 0) {
      res.status(400).json({ error: `Kategorie s ID '${category_id}' neexistuje.` });
      return;
    }

    await updateIngredientInDB(id, name.trim(), calories_per_gram, category_id);
    res.status(200).json({ message: "✅ Surovina byla úspěšně aktualizována." });
  } catch (err) {
    console.error("❌ Chyba při aktualizaci suroviny:", err);
    res.status(500).json({ error: "Chyba serveru při aktualizaci suroviny" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
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

router.get("/categories", async (_req: Request, res: Response) => {
  try {
    const categories = await getAllIngredientCategories();
    res.status(200).json(categories);
  } catch (err) {
    console.error("❌ Chyba při načítání kategorií:", err);
    res.status(500).json({ error: "Chyba serveru při načítání kategorií" });
  }
});

router.post("/categories", async (req: Request, res: Response) => {
  const { name } = req.body;
  if (typeof name !== "string" || name.trim() === "") {
    res.status(400).json({ error: "Neplatný název kategorie." });
    return;
  }

  const trimmed = name.trim();

  try {
    const exists = await db.query("SELECT id FROM ingredient_categories WHERE LOWER(name) = LOWER($1)", [trimmed]);
    if (exists.rows.length > 0) {
      res.status(409).json({ error: `Kategorie '${trimmed}' už existuje.` });
      return;
    }

    const category = await createIngredientCategory(trimmed);
    res.status(201).json(category);
  } catch (err) {
    console.error("❌ Chyba při vytváření kategorie:", err);
    res.status(500).json({ error: "Chyba serveru při vytváření kategorie" });
  }
});

router.put("/categories/:id", async (req: Request, res: Response) => {
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

router.delete("/categories/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Neplatné ID kategorie." });
    return;
  }

  try {
    await db.query("BEGIN");

    // Nastavení category_id = NULL u surovin, které používají danou kategorii
    await db.query("UPDATE ingredients SET category_id = NULL WHERE category_id = $1", [id]);

    // Smazání samotné kategorie
    await db.query("DELETE FROM ingredient_categories WHERE id = $1", [id]);

    await db.query("COMMIT");
    res.status(200).json({ message: "Kategorie byla smazána a surovinám odebrána." });
  } catch (err) {
    await db.query("ROLLBACK");
    console.error("❌ Chyba při mazání kategorie:", err);
    res.status(500).json({ error: "Chyba serveru při mazání kategorie." });
  }
});

export default router;