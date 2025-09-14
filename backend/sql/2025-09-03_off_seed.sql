-- backend/sql/2025-09-03_off_seed.sql

INSERT INTO off_products (
  code, product_name, brands, quantity, image_small_url,
  energy_kcal_100g, proteins_100g, carbs_100g, sugars_100g,
  fat_100g, saturated_fat_100g, fiber_100g, sodium_100g, last_synced
) VALUES
('4056489628903','Jogurt bílý bez laktózy','Milbona','500 g','https://images.openfoodfacts.org/images/products/405/648/962/8903/front_de.3.200.jpg',70,4,4.9,4.9,3.8,2.3,0,0.04, now()),
('8594002998411','Šunka výběrová','LE & CO','100 g',NULL,112,18,1,1,4,1.5,0,0.02, now()),
('8594007960352','Tvaroh měkký','Madeta','250 g',NULL,82,12,3,3,2,1.3,0,0.05, now()),
('8594005112012','Rýže jasmínová','Lagris','1 kg',NULL,360,7,79,0.1,0.6,0.2,1,0.01, now()),
('8593893412345','Kuřecí prsa chlazená','Vodňanské kuře','600 g',NULL,110,23,0,0,2,0.6,0,0.08, now())
ON CONFLICT (code) DO UPDATE
SET product_name = EXCLUDED.product_name,
    brands = EXCLUDED.brands,
    quantity = EXCLUDED.quantity,
    image_small_url = EXCLUDED.image_small_url,
    energy_kcal_100g = EXCLUDED.energy_kcal_100g,
    proteins_100g = EXCLUDED.proteins_100g,
    carbs_100g = EXCLUDED.carbs_100g,
    sugars_100g = EXCLUDED.sugars_100g,
    fat_100g = EXCLUDED.fat_100g,
    saturated_fat_100g = EXCLUDED.saturated_fat_100g,
    fiber_100g = EXCLUDED.fiber_100g,
    sodium_100g = EXCLUDED.sodium_100g,
    last_synced = now();