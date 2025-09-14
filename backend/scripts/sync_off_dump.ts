/**
 * Stream sync OFF dump -> Railway DB (off_products)
 * ENV:
 *   DATABASE_URL=postgresql://...  (Railway)
 *   OFF_BATCH_SIZE=2000            (default 2000)
 *   OFF_LANG=cs                    (jen preferovaná jména; fallback EN)
 *   STRICT_COUNTRY=ON|OFF          (default OFF – ber vše)
 *   OFF_COUNTRY_TAG=en:czech-republic (pokud STRICT_COUNTRY=ON, filtruj)
 */

import "dotenv/config";
import { createGunzip } from "zlib";
import https from "https";
import readline from "readline";
import { upsertOFFBatch, type OFFUpsertRow } from "../src/models/offModel";

const BATCH_SIZE = Number(process.env.OFF_BATCH_SIZE || 2000);
const LANG = (process.env.OFF_LANG || "cs").toLowerCase();
const FALLBACK_LANG = "en";
const STRICT_COUNTRY = String(process.env.STRICT_COUNTRY || "OFF").toUpperCase() === "ON";
const COUNTRY_TAG = process.env.OFF_COUNTRY_TAG || "";

const DUMP_URL = "https://static.openfoodfacts.org/data/openfoodfacts-products.jsonl.gz";

function pickName(p: any): string | null {
  const cs = p?.product_name_cs ?? p?.["product_name:cs"];
  const en = p?.product_name_en ?? p?.["product_name:en"];
  const base = p?.product_name ?? null;
  if (LANG === "cs") return cs ?? en ?? base ?? null;
  if (LANG === "en") return en ?? base ?? null;
  return base ?? en ?? null;
}

function asNumber(v: any): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function mapRow(p: any): OFFUpsertRow | null {
  if (!p?.code) return null;
  if (STRICT_COUNTRY) {
    const c = (Array.isArray(p?.countries_tags) ? p.countries_tags : []) as string[];
    if (COUNTRY_TAG && !c.includes(COUNTRY_TAG)) return null;
  }
  const name = pickName(p);
  const nutr = p?.nutriments || {};
  return {
    code: String(p.code),
    product_name: name,
    brands: p?.brands ?? null,
    quantity: p?.quantity ?? null,
    image_small_url: p?.image_small_url ?? p?.image_front_small_url ?? p?.image_url ?? null,
    energy_kcal_100g:
      asNumber(nutr["energy-kcal_100g"]) ?? asNumber(nutr.energy_kcal_100g),
    proteins_100g: asNumber(nutr.proteins_100g),
    carbs_100g: asNumber(nutr.carbohydrates_100g) ?? asNumber(nutr.carbs_100g),
    sugars_100g: asNumber(nutr.sugars_100g),
    fat_100g: asNumber(nutr.fat_100g),
    saturated_fat_100g:
      asNumber(nutr["saturated-fat_100g"]) ?? asNumber(nutr.saturated_fat_100g),
    fiber_100g: asNumber(nutr.fiber_100g),
    sodium_100g: asNumber(nutr.sodium_100g) ?? asNumber(nutr.salt_100g),
  };
}

async function main() {
  console.log(`➡️  Stahuju OFF dump: ${DUMP_URL}`);
  console.log(`   LANG=${LANG}, FALLBACK_LANG=${FALLBACK_LANG}, COUNTRY_TAG=${COUNTRY_TAG || "(none)"} STRICT_COUNTRY=${STRICT_COUNTRY ? "ON" : "OFF"}`);

  await new Promise<void>((resolve, reject) => {
    https.get(DUMP_URL, (resp) => {
      if (resp.statusCode && resp.statusCode >= 300 && resp.statusCode < 400 && resp.headers.location) {
        // redirect na S3 mirror
        https.get(resp.headers.location, (resp2) => pipeStream(resp2).then(resolve).catch(reject));
      } else {
        pipeStream(resp).then(resolve).catch(reject);
      }
    }).on("error", reject);
  });

  console.log("✅ Hotovo.");
}

async function pipeStream(incoming: NodeJS.ReadableStream) {
  const gunzip = createGunzip();
  incoming.pipe(gunzip);

  const rl = readline.createInterface({ input: gunzip });
  let batch: OFFUpsertRow[] = [];
  let processed = 0;
  let saved = 0;

  const flush = async () => {
    if (!batch.length) return;
    await upsertOFFBatch(batch);
    saved += batch.length;
    batch = [];
  };

  for await (const line of rl) {
    processed++;
    if (!line) continue;
    let obj: any;
    try {
      obj = JSON.parse(line);
    } catch {
      continue;
    }
    const row = mapRow(obj);
    if (row) {
      batch.push(row);
      if (batch.length >= BATCH_SIZE) {
        await flush();
        if (processed % 100000 === 0) {
          console.log(`   zpracováno: ${processed.toLocaleString("cs-CZ")} | uloženo: ${saved.toLocaleString("cs-CZ")}`);
        }
      }
    }
  }
  await flush();
  console.log(`   zpracováno: ${processed.toLocaleString("cs-CZ")} | uloženo: ${saved.toLocaleString("cs-CZ")}`);
}

main().catch((e) => {
  console.error("❌ sync_off_dump failed:", e);
  process.exit(1);
});