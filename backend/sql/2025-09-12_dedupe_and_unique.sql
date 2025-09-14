BEGIN;

-- 1) vybereme „přeživší“ řádek pro každý název (nejnižší id)
WITH survivor AS (
  SELECT name, MIN(id) AS keep_id
  FROM ingredients
  GROUP BY name
  HAVING COUNT(*) > 1
),
-- 2) agregujeme hodnoty maker napříč duplicitami
agg AS (
  SELECT
    i.name,
    MAX(i.calories_per_gram)      AS calories_per_gram,
    MAX(i.energy_kcal_100g)       AS energy_kcal_100g,
    MAX(i.proteins_100g)          AS proteins_100g,
    MAX(i.carbs_100g)             AS carbs_100g,
    MAX(i.sugars_100g)            AS sugars_100g,
    MAX(i.fat_100g)               AS fat_100g,
    MAX(i.saturated_fat_100g)     AS saturated_fat_100g,
    MAX(i.fiber_100g)             AS fiber_100g,
    MAX(i.sodium_100g)            AS sodium_100g,
    MAX(i.default_grams)          AS default_grams,
    MAX(i.category_id)            AS category_id,
    MAX(i.unit_name)              AS unit_name,
    MAX(i.off_id)                 AS off_id
  FROM ingredients i
  GROUP BY i.name
),
-- 3) doplníme data do „přeživších“ řádků
upd_survivor AS (
  UPDATE ingredients i
  SET
    calories_per_gram   = COALESCE(i.calories_per_gram,   a.calories_per_gram),
    energy_kcal_100g    = COALESCE(i.energy_kcal_100g,    a.energy_kcal_100g),
    proteins_100g       = COALESCE(i.proteins_100g,       a.proteins_100g),
    carbs_100g          = COALESCE(i.carbs_100g,          a.carbs_100g),
    sugars_100g         = COALESCE(i.sugars_100g,         a.sugars_100g),
    fat_100g            = COALESCE(i.fat_100g,            a.fat_100g),
    saturated_fat_100g  = COALESCE(i.saturated_fat_100g,  a.saturated_fat_100g),
    fiber_100g          = COALESCE(i.fiber_100g,          a.fiber_100g),
    sodium_100g         = COALESCE(i.sodium_100g,         a.sodium_100g),
    default_grams       = COALESCE(i.default_grams,       a.default_grams),
    category_id         = COALESCE(i.category_id,         a.category_id),
    unit_name           = COALESCE(i.unit_name,           a.unit_name),
    off_id              = COALESCE(i.off_id,              a.off_id)
  FROM survivor s
  JOIN agg a ON a.name = s.name
  WHERE i.id = s.keep_id
  RETURNING i.id, i.name
),
-- 4) přesměrujeme FK v recipe_ingredients na přeživší id
repoint AS (
  UPDATE recipe_ingredients ri
  SET ingredient_id = s.keep_id
  FROM survivor s
  JOIN ingredients i ON i.name = s.name
  WHERE ri.ingredient_id = i.id
    AND i.id <> s.keep_id
  RETURNING ri.*
)
-- 5) smažeme duplicitní řádky
DELETE FROM ingredients i USING survivor s
WHERE i.name = s.name AND i.id <> s.keep_id;

-- 6) přidáme unikátní index na name
CREATE UNIQUE INDEX IF NOT EXISTS ingredients_name_unique ON ingredients(name);

COMMIT;