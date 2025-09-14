-- Rozšíření pro rychlé fulltext/LIKE vyhledávání
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Lokální cache produktů z Open Food Facts
CREATE TABLE IF NOT EXISTS public.off_products (
  code                TEXT PRIMARY KEY,
  product_name        TEXT,
  brands              TEXT,
  quantity            TEXT,
  image_small_url     TEXT,
  energy_kcal_100g    NUMERIC,
  proteins_100g       NUMERIC,
  carbs_100g          NUMERIC,
  sugars_100g         NUMERIC,
  fat_100g            NUMERIC,
  saturated_fat_100g  NUMERIC,
  fiber_100g          NUMERIC,
  sodium_100g         NUMERIC,
  last_synced         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexy pro rychlé vyhledávání názvu/brandu
CREATE INDEX IF NOT EXISTS off_products_name_trgm
  ON public.off_products USING GIN (product_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS off_products_brands_trgm
  ON public.off_products USING GIN (brands gin_trgm_ops);