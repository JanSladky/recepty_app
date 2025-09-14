import * as fs from "fs";
import * as path from "path";
import csv from "csv-parser";

/**
 * Vstup: backend/data/translations/ingredients_to_translate.csv
 * Výstup: přepíše tentýž soubor do formátu:
 *   name,name_cs
 *   ...
 * Zároveň uloží zálohu .bak
 */

type RowAny = Record<string, string>;

const inputPath = path.resolve(process.cwd(), "data", "translations", "ingredients_to_translate.csv");
const backupPath = inputPath + ".bak";

function norm(s: string | undefined | null): string {
  if (s == null) return "";
  // odeber BOM, ořízni mezery, sjednoť uvozovky
  return String(s).replace(/^\uFEFF/, "").trim();
}

async function readCsv(file: string): Promise<RowAny[]> {
  return new Promise((resolve, reject) => {
    const rows: RowAny[] = [];
    fs.createReadStream(file)
      // @ts-ignore csv-parser nemá přesné TS typy
      .pipe(csv())
      .on("data", (r: RowAny) => rows.push(r))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

function toCsvLine(values: string[]): string {
  // Vytvoř korektní CSV hodnoty (escapuj uvozovky, vlož do "")
  return values
    .map((v) => {
      const s = v.replace(/"/g, '""');
      return `"${s}"`;
    })
    .join(",");
}

async function main() {
  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Nenalezen soubor: ${path.relative(process.cwd(), inputPath)}`);
    process.exit(1);
  }

  console.log(`🧹 Čtu ${path.relative(process.cwd(), inputPath)} …`);
  const rows = await readCsv(inputPath);
  if (!rows.length) {
    console.error("❌ Soubor je prázdný.");
    process.exit(1);
  }

  // Rozpoznání názvů sloupců (povolím několik variant hlaviček)
  const headerKeys = Object.keys(rows[0]).map((k) => k.toLowerCase());
  const hasId = headerKeys.includes("id");

  // najdi název sloupce pro name a name_cs (bez ohledu na case)
  const nameKey = Object.keys(rows[0]).find((k) => k.toLowerCase() === "name");
  const nameCsKey = Object.keys(rows[0]).find((k) => k.toLowerCase() === "name_cs");

  if (!nameKey || !nameCsKey) {
    console.error("❌ V CSV musí být sloupce 'name' a 'name_cs'.");
    process.exit(1);
  }

  // deduplikace podle name (poslední výskyt vyhraje)
  const map = new Map<string, string>();

  for (const r of rows) {
    const name = norm(r[nameKey]);
    const name_cs = norm(r[nameCsKey]);

    if (!name) continue;                // bez názvu přeskoč
    if (!name_cs) continue;             // prázdné překlady přeskoč (nechceme psát prázdné)
    map.set(name, name_cs);
  }

  if (map.size === 0) {
    console.error("❌ Po vyčištění nic nezbylo (chybí platné dvojice name/name_cs).");
    process.exit(1);
  }

  // záloha
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(inputPath, backupPath);
    console.log(`🗂️  Záloha vytvořena → ${path.relative(process.cwd(), backupPath)}`);
  } else {
    console.log(`🗂️  Záloha existuje → ${path.relative(process.cwd(), backupPath)}`);
  }

  // zapiš zpět ve formátu name,name_cs
  const outLines: string[] = [];
  outLines.push("name,name_cs");
  for (const [name, name_cs] of map.entries()) {
    outLines.push(toCsvLine([name, name_cs]));
  }

  fs.writeFileSync(inputPath, outLines.join("\n"), "utf8");
  console.log(`✅ Hotovo. Přepsán soubor v čistém formátu (ponecháno ${map.size} záznamů).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});