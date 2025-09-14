-- ZÁKLADNÍ SUROVINY (explicitní typy, bez UNIQUE indexu)

-- 1) UPDATE existujících řádků podle názvu (case-insensitive)
WITH src(name, energy_kcal_100g, proteins_100g, carbs_100g, sugars_100g,
         fat_100g, saturated_fat_100g, fiber_100g, sodium_100g) AS (
  VALUES
    ('Jahoda'::text      , 32::numeric , 0.7::numeric , 7.7::numeric , NULL::numeric , 0.3::numeric , NULL::numeric , NULL::numeric , NULL::numeric),
    ('Jablko'::text      , 52::numeric , 0.3::numeric , 14.0::numeric, NULL::numeric , 0.2::numeric , NULL::numeric , NULL::numeric , NULL::numeric),
    ('Banán'::text       , 89::numeric , 1.1::numeric , 23.0::numeric, NULL::numeric , 0.3::numeric , NULL::numeric , NULL::numeric , NULL::numeric),
    ('Brambora'::text    , 77::numeric , 2.0::numeric , 17.0::numeric, NULL::numeric , 0.1::numeric , NULL::numeric , NULL::numeric , NULL::numeric),
    ('Rýže vařená'::text ,130::numeric , 2.7::numeric , 28.0::numeric, NULL::numeric , 0.3::numeric , NULL::numeric , NULL::numeric , NULL::numeric),
    ('Vejce'::text       ,155::numeric ,13.0::numeric , 1.1::numeric , NULL::numeric ,11.0::numeric , NULL::numeric , NULL::numeric , NULL::numeric)
)
UPDATE ingredients i
SET
  energy_kcal_100g   = s.energy_kcal_100g,
  proteins_100g      = s.proteins_100g,
  carbs_100g         = s.carbs_100g,
  sugars_100g        = s.sugars_100g,
  fat_100g           = s.fat_100g,
  saturated_fat_100g = s.saturated_fat_100g,
  fiber_100g         = s.fiber_100g,
  sodium_100g        = s.sodium_100g,
  calories_per_gram  = (s.energy_kcal_100g / 100.0)
FROM src s
WHERE lower(i.name) = lower(s.name);

-- 2) INSERT chybějících řádků (duplicitně definujeme src – WITH platí vždy jen pro 1 příkaz)
WITH src(name, energy_kcal_100g, proteins_100g, carbs_100g, sugars_100g,
         fat_100g, saturated_fat_100g, fiber_100g, sodium_100g) AS (
  VALUES
    ('Jahoda'::text      , 32::numeric , 0.7::numeric , 7.7::numeric , NULL::numeric , 0.3::numeric , NULL::numeric , NULL::numeric , NULL::numeric),
    ('Jablko'::text      , 52::numeric , 0.3::numeric , 14.0::numeric, NULL::numeric , 0.2::numeric , NULL::numeric , NULL::numeric , NULL::numeric),
    ('Banán'::text       , 89::numeric , 1.1::numeric , 23.0::numeric, NULL::numeric , 0.3::numeric , NULL::numeric , NULL::numeric , NULL::numeric),
    ('Brambora'::text    , 77::numeric , 2.0::numeric , 17.0::numeric, NULL::numeric , 0.1::numeric , NULL::numeric , NULL::numeric , NULL::numeric),
    ('Rýže vařená'::text ,130::numeric , 2.7::numeric , 28.0::numeric, NULL::numeric , 0.3::numeric , NULL::numeric , NULL::numeric , NULL::numeric),
    ('Vejce'::text       ,155::numeric ,13.0::numeric , 1.1::numeric , NULL::numeric ,11.0::numeric , NULL::numeric , NULL::numeric , NULL::numeric)
)
INSERT INTO ingredients (
  name,
  calories_per_gram,
  category_id,
  default_grams,
  unit_name,
  energy_kcal_100g,
  proteins_100g,
  carbs_100g,
  sugars_100g,
  fat_100g,
  saturated_fat_100g,
  fiber_100g,
  sodium_100g
)
SELECT
  s.name,
  (s.energy_kcal_100g / 100.0) AS calories_per_gram,
  5         AS category_id,     -- uprav podle své výchozí kategorie (klidně NULL)
  NULL      AS default_grams,
  NULL      AS unit_name,
  s.energy_kcal_100g,
  s.proteins_100g,
  s.carbs_100g,
  s.sugars_100g,
  s.fat_100g,
  s.saturated_fat_100g,
  s.fiber_100g,
  s.sodium_100g
FROM src s
WHERE NOT EXISTS (
  SELECT 1 FROM ingredients i WHERE lower(i.name) = lower(s.name)
);