-- Přidá pole pro napojení na Open Food Facts + makra na 100 g/ml
ALTER TABLE ingredients
  ADD COLUMN IF NOT EXISTS off_id TEXT,
  ADD COLUMN IF NOT EXISTS energy_kcal_100g NUMERIC,
  ADD COLUMN IF NOT EXISTS proteins_100g NUMERIC,
  ADD COLUMN IF NOT EXISTS carbs_100g NUMERIC,
  ADD COLUMN IF NOT EXISTS sugars_100g NUMERIC,
  ADD COLUMN IF NOT EXISTS fat_100g NUMERIC,
  ADD COLUMN IF NOT EXISTS saturated_fat_100g NUMERIC,
  ADD COLUMN IF NOT EXISTS fiber_100g NUMERIC,
  ADD COLUMN IF NOT EXISTS sodium_100g NUMERIC,
  ADD COLUMN IF NOT EXISTS off_last_synced TIMESTAMP NULL;

-- Nepovinný unikátní index na OFF ID (jeden ingredient = max jeden OFF produkt)
CREATE UNIQUE INDEX IF NOT EXISTS ingredients_off_id_uindex ON ingredients (off_id)
WHERE off_id IS NOT NULL;

-- Usnadní case-insensitive match jménem
CREATE UNIQUE INDEX IF NOT EXISTS ingredients_lower_name_uindex
  ON ingredients (LOWER(name));