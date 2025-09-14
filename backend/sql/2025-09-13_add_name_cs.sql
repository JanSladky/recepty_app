BEGIN;

-- 1) český název
ALTER TABLE ingredients
  ADD COLUMN IF NOT EXISTS name_cs text;

-- 2) index pro rychlé hledání podle českého názvu
CREATE INDEX IF NOT EXISTS ingredients_name_cs_trgm
  ON ingredients
  USING gin (name_cs gin_trgm_ops);

COMMIT;