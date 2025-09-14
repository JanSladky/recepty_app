// 📁 backend/scripts/import_translations.ts
import * as fs from "fs";
import * as path from "path";
import csv from "csv-parser";
import db from "../src/utils/db";

type Row = {
  id?: string;
  name?: string;
  name_cs?: string;
};

function clean(s?: string | null): string {
  if (!s) return "";
  return String(s).replace(/\s+/g, " ").trim();
}

async function ensureNameCsColumn() {
  const client = await db.connect();
  try {
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'ingredients' AND column_name = 'name_cs'
        ) THEN
          ALTER TABLE ingredients ADD COLUMN name_cs text;
          CREATE INDEX IF NOT EXISTS ingredients_name_cs_trgm
            ON ingredients USING gin (name_cs gin_trgm_ops);
        END IF;
      END$$;
    `);
  } finally {
    client.release();
  }
}

async function loadCSV(csvPath: string): Promise<Row[]> {
  if (!fs.existsSync(csvPath)) {
    throw new Error(
      `Soubor nenalezen: ${csvPath}\nUlož ho ze Sheets jako CSV do: backend/data/translations/ingredients_to_translate.csv`
    );
  }
  const rows: Row[] = [];
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvPath)
      // @ts-ignore
      .pipe(csv())
      .on("data", (r: Row) => rows.push(r))
      .on("end", resolve)
      .on("error", reject);
  });
  return rows;
}

async function updateByIdOrName(client: any, r: Row): Promise<"byId" | "byName" | "skipped"> {
  const idNum =
    r.id != null && String(r.id).trim() !== "" ? Number(String(r.id).trim()) : NaN;
  const name = clean(r.name);
  const nameCs = clean(r.name_cs);

  if (!nameCs || (Number.isNaN(idNum) && !name)) return "skipped";

  // 1) podle ID
  if (!Number.isNaN(idNum)) {
    const exists = await client.query(`SELECT id FROM ingredients WHERE id = $1`, [idNum]);
    if (exists.rows.length > 0) {
      await client.query(`UPDATE ingredients SET name_cs = $2 WHERE id = $1`, [idNum, nameCs]);
      return "byId";
    }
  }

  // 2) fallback podle názvu (case-insensitive, první shoda)
  if (name) {
    const found = await client.query(
      `SELECT id FROM ingredients WHERE lower(name) = lower($1) LIMIT 1`,
      [name]
    );
    if (found.rows.length > 0) {
      const theId = found.rows[0].id as number;
      await client.query(`UPDATE ingredients SET name_cs = $2 WHERE id = $1`, [theId, nameCs]);
      return "byName";
    }
  }

  return "skipped";
}

// Jednoduché zpoždění mezi dávkami (pomáhá stabilitě na PaaS)
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function run() {
  const csvPath = path.resolve(
    process.cwd(),
    "data",
    "translations",
    "ingredients_to_translate.csv"
  );

  // 1) csv
  const rows = await loadCSV(csvPath);
  console.log(`📄 Načteno ${rows.length} řádků s překlady z ${path.relative(process.cwd(), csvPath)}`);

  // 2) sloupec name_cs (pro jistotu)
  await ensureNameCsColumn();

  // 3) dávkové zpracování s krátkými transakcemi
  const BATCH = 300;

  let updated = 0;
  let byId = 0;
  let byName = 0;
  let skipped = 0;

  for (let i = 0; i < rows.length; i += BATCH) {
    const slice = rows.slice(i, i + BATCH);

    // každá dávka má vlastní connection + transakci
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      // volitelně lze zkrátit timeouts, ale necháme defaulty
      for (const r of slice) {
        const how = await updateByIdOrName(client, r);
        if (how === "byId") {
          updated++; byId++;
        } else if (how === "byName") {
          updated++; byName++;
        } else {
          skipped++;
        }
      }
      await client.query("COMMIT");
      console.log(`… zpracováno ${Math.min(i + BATCH, rows.length)}/${rows.length}`);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(`⚠️  Dávka ${i + 1}–${i + slice.length} selhala:`, err);
      console.error("   Pokusím se pokračovat další dávkou…");
      // nepřerušujeme — přeskočíme dávku a jdeme dál
    } finally {
      client.release();
    }

    // krátká pauza—pomáhá proti “Connection terminated unexpectedly” na některých hostinzích
    await sleep(150);
  }

  console.log("────────────────────────────────────────");
  console.log(`✅ Hotovo. Aktualizováno: ${updated} (podle id: ${byId}, podle názvu: ${byName}), přeskočeno: ${skipped}.`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});