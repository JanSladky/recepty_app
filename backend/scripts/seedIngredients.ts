import dotenv from "dotenv";
dotenv.config();

import db from "../src/utils/db";

console.log("🌐 Připojuji se na:", process.env.DATABASE_URL);

// Pomocná funkce pro získání (nebo vytvoření) ID kategorie
async function getCategoryId(name: string): Promise<number> {
  const result = await db.query("SELECT id FROM ingredient_categories WHERE name = $1", [name]);
  if (result.rows.length === 0) {
    const insert = await db.query("INSERT INTO ingredient_categories (name) VALUES ($1) RETURNING id", [name]);
    return insert.rows[0].id;
  }
  return result.rows[0].id;
}

// Seznam surovin
const INGREDIENTS = [
  { name: "Chléb", category: "pečivo", calories: 2.49 },
  { name: "Rohlík", category: "pečivo", calories: 2.86 },
  { name: "Houska", category: "pečivo", calories: 2.86 },
  { name: "Bageta", category: "pečivo", calories: 2.86 },
  { name: "Celozrnný chléb", category: "pečivo", calories: 2.86 },
  { name: "Toastový chléb", category: "pečivo", calories: 2.86 },
  { name: "Croissant", category: "pečivo", calories: 4.06 },
  { name: "Lavaš", category: "pečivo", calories: 2.86 },
  { name: "Tortilla", category: "pečivo", calories: 2.86 },
  { name: "Piškoty", category: "pečivo", calories: 3.97 },
  { name: "Sušenky", category: "pečivo", calories: 4.5 },
  { name: "Strouhanka", category: "pečivo", calories: 3.5 },
  { name: "Těstoviny", category: "pečivo", calories: 3.57 },
  { name: "Špagety", category: "pečivo", calories: 3.71 },
  { name: "Penne", category: "pečivo", calories: 3.71 },
  { name: "Fusilli", category: "pečivo", calories: 3.71 },
  { name: "Lasagne", category: "pečivo", calories: 3.71 },
  { name: "Rýže", category: "pečivo", calories: 3.58 },
  { name: "Jasmínová rýže", category: "pečivo", calories: 3.52 },
  { name: "Basmati rýže", category: "pečivo", calories: 3.52 },
  { name: "Kuskus", category: "pečivo", calories: 3.76 },
  { name: "Bulgur", category: "pečivo", calories: 3.42 },
  { name: "Quinoa", category: "pečivo", calories: 3.68 },
  { name: "Jáhly", category: "pečivo", calories: 3.78 },
  { name: "Pohanka", category: "pečivo", calories: 3.43 },
  { name: "Polenta", category: "pečivo", calories: 3.58 },
  { name: "Cizrna", category: "luštěniny", calories: 3.64 },
  { name: "Vejce", category: "mléčné", calories: 1.51 },
  { name: "Máslo", category: "mléčné", calories: 7.34 },
  { name: "Margarín", category: "mléčné", calories: 7.34 },
  { name: "Mléko", category: "mléčné", calories: 0.47 },
  { name: "Kondenzované mléko", category: "mléčné", calories: 3.21 },
  { name: "Smetana ke šlehání", category: "mléčné", calories: 3.45 },
  { name: "Smetana na vaření", category: "mléčné", calories: 2.0 },
  { name: "Zakysaná smetana", category: "mléčné", calories: 1.8 },
  { name: "Jogurt bílý", category: "mléčné", calories: 0.95 },
  { name: "Jogurt ovocný", category: "mléčné", calories: 1.15 },
  { name: "Tvaroh měkký", category: "mléčné", calories: 1.2 },
  { name: "Tvaroh tvrdý", category: "mléčné", calories: 1.5 },
  { name: "Sýr Eidam", category: "mléčné", calories: 3.14 },
  { name: "Sýr čedar", category: "mléčné", calories: 4.02 },
  { name: "Sýr niva", category: "mléčné", calories: 3.81 },
  { name: "Mozzarella", category: "mléčné", calories: 2.8 },
  { name: "Parmezán", category: "mléčné", calories: 4.31 },
  { name: "Ricotta", category: "mléčné", calories: 1.74 },
  { name: "Cottage", category: "mléčné", calories: 0.98 },
  { name: "Mascarpone", category: "mléčné", calories: 4.5 },
  { name: "Termizovaný sýr", category: "mléčné", calories: 3.0 },
  { name: "Sýr Lučina", category: "mléčné", calories: 3.06 },
  { name: "Kefír", category: "mléčné", calories: 0.45 },
  { name: "Podmáslí", category: "mléčné", calories: 0.35 },
  { name: "Losos", category: "ryby", calories: 2.12 },
  { name: "Tuňák", category: "ryby", calories: 1.5 },
  { name: "Treska", category: "ryby", calories: 0.76 },
  { name: "Makrela", category: "ryby", calories: 2.0 },
  { name: "Sardinky", category: "ryby", calories: 1.8 },
  { name: "Sledi", category: "ryby", calories: 1.8 },
  { name: "Pstruh", category: "ryby", calories: 1.5 },
  { name: "Kapří maso", category: "ryby", calories: 1.27 },
  { name: "Krevety", category: "ryby", calories: 1.0 },
  { name: "Kalmáry", category: "ryby", calories: 1.0 },
  { name: "Mušle", category: "ryby", calories: 0.8 },
  { name: "Ančovičky", category: "ryby", calories: 1.5 },
  { name: "Hovězí maso mleté", category: "maso", calories: 2.5 },
  { name: "Vepřové maso mleté", category: "maso", calories: 2.5 },
  { name: "Mleté maso mix", category: "maso", calories: 2.5 },
  { name: "Hovězí svíčková", category: "maso", calories: 2.3 },
  { name: "Hovězí žebra", category: "maso", calories: 2.5 },
  { name: "Vepřová panenka", category: "maso", calories: 2.5 },
  { name: "Vepřová plec", category: "maso", calories: 2.5 },
  { name: "Vepřový bok", category: "maso", calories: 2.5 },
  { name: "Kuřecí prsa", category: "maso", calories: 1.1 },
  { name: "Kuřecí maso", category: "maso", calories: 1.19 },
  { name: "Kuřecí stehna", category: "maso", calories: 1.19 },
  { name: "Kuřecí křídla", category: "maso", calories: 2.5 },
  { name: "Krůtí maso", category: "maso", calories: 1.15 },
  { name: "Kachna", category: "maso", calories: 2.5 },
  { name: "Husí maso", category: "maso", calories: 2.5 },
  { name: "Klobása", category: "maso", calories: 2.5 },
  { name: "Šunka", category: "maso", calories: 2.6 },
  { name: "Slanina", category: "maso", calories: 8.11 },
  { name: "Salám", category: "maso", calories: 2.5 },
  { name: "Uzené maso", category: "maso", calories: 2.5 },
  { name: "Zvěřina", category: "maso", calories: 2.5 },
  { name: "Jehněčí maso", category: "maso", calories: 2.5 },
  { name: "Tlačenka", category: "maso", calories: 2.5 },
  { name: "Párky", category: "maso", calories: 2.5 },
  { name: "Čočka červená", category: "luštěniny", calories: 2.5 },
];

async function seed() {
  for (const item of INGREDIENTS) {
    try {
      const categoryId = await getCategoryId(item.category);
      const exists = await db.query("SELECT id FROM ingredients WHERE name = $1", [item.name]);
      if (exists.rows.length === 0) {
        await db.query(
          "INSERT INTO ingredients (name, category_id, calories_per_gram) VALUES ($1, $2, $3)",
          [item.name, categoryId, item.calories]
        );
        console.log(`✅ Vloženo: ${item.name}`);
      } else {
        console.log(`ℹ️ Existuje, přeskočeno: ${item.name}`);
      }
    } catch (err) {
      console.error(`❌ Chyba u ${item.name}:`, err);
    }
  }

  process.exit();
}

seed();