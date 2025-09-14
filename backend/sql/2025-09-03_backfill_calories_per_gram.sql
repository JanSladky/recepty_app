ALTER TABLE ingredients
  ADD COLUMN IF NOT EXISTS calories_per_gram NUMERIC;

UPDATE ingredients
SET calories_per_gram = (energy_kcal_100g / 100.0)
WHERE calories_per_gram IS NULL
  AND energy_kcal_100g IS NOT NULL;