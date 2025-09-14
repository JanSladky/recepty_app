-- Přidá (pokud chybí) nutriční sloupce přímo do tabulky ingredients
ALTER TABLE ingredients
  ADD COLUMN IF NOT EXISTS energy_kcal_100g       numeric,
  ADD COLUMN IF NOT EXISTS proteins_100g          numeric,
  ADD COLUMN IF NOT EXISTS carbs_100g             numeric,
  ADD COLUMN IF NOT EXISTS sugars_100g            numeric,
  ADD COLUMN IF NOT EXISTS fat_100g               numeric,
  ADD COLUMN IF NOT EXISTS saturated_fat_100g     numeric,
  ADD COLUMN IF NOT EXISTS fiber_100g             numeric,
  ADD COLUMN IF NOT EXISTS sodium_100g            numeric;

-- (volitelně) indexy pro rychlé dotazy/filtry
CREATE INDEX IF NOT EXISTS ingredients_energy_kcal_100g_idx   ON ingredients(energy_kcal_100g);
CREATE INDEX IF NOT EXISTS ingredients_proteins_100g_idx      ON ingredients(proteins_100g);
CREATE INDEX IF NOT EXISTS ingredients_carbs_100g_idx         ON ingredients(carbs_100g);