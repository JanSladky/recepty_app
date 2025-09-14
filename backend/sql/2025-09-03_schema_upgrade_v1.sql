-- backend/sql/2025-09-03_schema_upgrade_v1.sql
-- Upgrade schématu tak, aby sedělo s aktuálním backendem

-- 1) Ingredient Categories (tabulka chybí)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'ingredient_categories'
  ) THEN
    CREATE TABLE ingredient_categories (
      id   SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );
  END IF;
END$$;

-- 2) Ingredients: přidáme případně sloupce a napojení na kategorie
DO $$
BEGIN
  -- category_id
  IF NOT EXISTS (
    SELECT 1
      FROM information_schema.columns
     WHERE table_name='ingredients' AND column_name='category_id'
  ) THEN
    ALTER TABLE ingredients ADD COLUMN category_id INTEGER NULL;
  END IF;

  -- unit_name
  IF NOT EXISTS (
    SELECT 1
      FROM information_schema.columns
     WHERE table_name='ingredients' AND column_name='unit_name'
  ) THEN
    ALTER TABLE ingredients ADD COLUMN unit_name TEXT NULL;
  END IF;

  -- default_grams
  IF NOT EXISTS (
    SELECT 1
      FROM information_schema.columns
     WHERE table_name='ingredients' AND column_name='default_grams'
  ) THEN
    ALTER TABLE ingredients ADD COLUMN default_grams NUMERIC NULL;
  END IF;
END$$;

-- FK na ingredient_categories (pokud ještě není)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM information_schema.table_constraints
     WHERE table_name='ingredients' AND constraint_type='FOREIGN KEY' AND constraint_name='ingredients_category_id_fkey'
  ) THEN
    ALTER TABLE ingredients
      ADD CONSTRAINT ingredients_category_id_fkey
      FOREIGN KEY (category_id) REFERENCES ingredient_categories(id)
      ON DELETE SET NULL;
  END IF;
END$$;

-- 3) Recipe Ingredients: přidáme display (model i controller ho používají)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM information_schema.columns
     WHERE table_name='recipe_ingredients' AND column_name='display'
  ) THEN
    ALTER TABLE recipe_ingredients ADD COLUMN display TEXT NULL;
  END IF;
END$$;

-- 4) Recipes: přidáme chybějící sloupce (status, steps, notes, moderace)
DO $$
BEGIN
  -- notes (používá backend; description u tebe už existuje a je NOT NULL)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_name='recipes' AND column_name='notes'
  ) THEN
    ALTER TABLE recipes ADD COLUMN notes TEXT NULL;
    -- backfill notes z description, pokud existuje
    BEGIN
      EXECUTE 'UPDATE recipes SET notes = description WHERE notes IS NULL AND description IS NOT NULL';
    EXCEPTION WHEN undefined_column THEN
      -- žádný description? nevadí
      NULL;
    END;
  END IF;

  -- steps (JSONB)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_name='recipes' AND column_name='steps'
  ) THEN
    ALTER TABLE recipes ADD COLUMN steps JSONB NOT NULL DEFAULT '[]'::jsonb;
  END IF;

  -- status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_name='recipes' AND column_name='status'
  ) THEN
    ALTER TABLE recipes ADD COLUMN status TEXT NOT NULL DEFAULT 'APPROVED';
  END IF;

  -- autor a moderace
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_name='recipes' AND column_name='created_by'
  ) THEN
    ALTER TABLE recipes ADD COLUMN created_by INTEGER NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_name='recipes' AND column_name='approved_by'
  ) THEN
    ALTER TABLE recipes ADD COLUMN approved_by INTEGER NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_name='recipes' AND column_name='approved_at'
  ) THEN
    ALTER TABLE recipes ADD COLUMN approved_at TIMESTAMP NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_name='recipes' AND column_name='rejection_reason'
  ) THEN
    ALTER TABLE recipes ADD COLUMN rejection_reason TEXT NULL;
  END IF;
END$$;

-- 5) Seed: vložíme výchozí kategorii, pokud není
INSERT INTO ingredient_categories(name)
SELECT 'Nezařazené'
WHERE NOT EXISTS (SELECT 1 FROM ingredient_categories WHERE name = 'Nezařazené');

-- 6) Nastavíme category_id na 'Nezařazené', pokud je NULL a tabulka ingredients existuje
DO $$
DECLARE
  cat_id INTEGER;
BEGIN
  SELECT id INTO cat_id FROM ingredient_categories WHERE name = 'Nezařazené';
  IF cat_id IS NOT NULL THEN
    BEGIN
      EXECUTE 'UPDATE ingredients SET category_id = $1 WHERE category_id IS NULL' USING cat_id;
    EXCEPTION WHEN undefined_table THEN
      -- tabulka ingredients by existovat měla, ale pro jistotu
      NULL;
    END;
  END IF;
END$$;