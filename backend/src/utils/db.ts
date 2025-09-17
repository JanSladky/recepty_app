// 📁 backend/src/utils/db.ts
import "dotenv/config";
import pg from "pg";

// Pomocná funkce na detekci hostu a rozhodnutí o SSL
function needSSLFromUrl(conn?: string): boolean {
  if (!conn) return false;
  try {
    const u = new URL(conn);
    const h = (u.hostname || "").toLowerCase();
    // Railway/proxy/cloud -> SSL
    if (h.includes("proxy.rlwy.net") || h.includes("railway") || h.includes("aws") || h.includes("gcp")) return true;
    // lokál -> bez SSL
    if (h === "localhost" || h === "127.0.0.1" || h === "::1") return false;
    return true; // default raději SSL
  } catch {
    return true;
  }
}

function needSSLFromHost(host?: string): boolean {
  if (!host) return false;
  const h = host.toLowerCase();
  if (h === "localhost" || h === "127.0.0.1" || h === "::1") return false;
  return true;
}

// Pro přehledné logy
function hostFromUrl(conn?: string): string | null {
  try {
    return conn ? new URL(conn).hostname : null;
  } catch {
    return null;
  }
}

const { DATABASE_URL, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

let pool: pg.Pool;

/* ✅ Používej jen DATABASE_URL (gondola). Když chybí, spadni s chybou. */
if (!DATABASE_URL) {
  throw new Error("❌ Missing DATABASE_URL – nastav ji v .env na gondola.proxy.rlwy.net připojení.");
}

const useSSL = needSSLFromUrl(DATABASE_URL);
pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
  max: 10,
});
console.log(`🔌 PG via DATABASE_URL → host=${hostFromUrl(DATABASE_URL) ?? "?"} ssl=${useSSL ? "on" : "off"}`);

pool.on("error", (err) => {
  console.error("❌ Nezachycená chyba v PG poolu:", err);
});

export default {
  query: (text: string, params?: any[]) => pool.query(text, params),
  connect: () => pool.connect(),
  end: () => pool.end(),
};
