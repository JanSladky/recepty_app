-- Unikátní index na LOWER(name), ať lze dělat ON CONFLICT
CREATE UNIQUE INDEX IF NOT EXISTS ingredients_name_lower_unique
ON ingredients (LOWER(name));