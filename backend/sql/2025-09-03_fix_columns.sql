-- Přidá chybějící sloupce, které očekává aplikace

-- 1) recipe_ingredients.display
ALTER TABLE recipe_ingredients
  ADD COLUMN IF NOT EXISTS display TEXT;

-- 2) ingredients.category_id (napojení na ingredient_categories)
ALTER TABLE ingredients
  ADD COLUMN IF NOT EXISTS category_id INTEGER
  REFERENCES ingredient_categories(id) ON DELETE SET NULL;

-- 3) ingredients.default_grams (pro přepočet "ks" -> gramy)
ALTER TABLE ingredients
  ADD COLUMN IF NOT EXISTS default_grams NUMERIC;

-- 4) ingredients.unit_name (základní jednotka zobrazení)
ALTER TABLE ingredients
  ADD COLUMN IF NOT EXISTS unit_name TEXT;

-- (volitelně) index na lower(name) pro rychlé hledání – pokud už existuje, nic se nestane
CREATE UNIQUE INDEX IF NOT EXISTS ingredients_lower_name_uindex ON ingredients (LOWER(name));