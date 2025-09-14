"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// 📁 backend/src/utils/db.ts
require("dotenv/config");
const pg_1 = __importDefault(require("pg"));
// Pomocná funkce na detekci hostu a rozhodnutí o SSL
function needSSLFromUrl(conn) {
    if (!conn)
        return false;
    try {
        const u = new URL(conn);
        const h = (u.hostname || "").toLowerCase();
        // Railway/proxy/cloud -> SSL
        if (h.includes("proxy.rlwy.net") || h.includes("railway") || h.includes("aws") || h.includes("gcp"))
            return true;
        // lokál -> bez SSL
        if (h === "localhost" || h === "127.0.0.1" || h === "::1")
            return false;
        return true; // default raději SSL
    }
    catch {
        return true;
    }
}
function needSSLFromHost(host) {
    if (!host)
        return false;
    const h = host.toLowerCase();
    if (h === "localhost" || h === "127.0.0.1" || h === "::1")
        return false;
    return true;
}
// Pro přehledné logy
function hostFromUrl(conn) {
    try {
        return conn ? new URL(conn).hostname : null;
    }
    catch {
        return null;
    }
}
const { DATABASE_URL, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, } = process.env;
let pool;
if (DATABASE_URL) {
    const useSSL = needSSLFromUrl(DATABASE_URL);
    pool = new pg_1.default.Pool({
        connectionString: DATABASE_URL,
        ssl: useSSL ? { rejectUnauthorized: false } : false,
        max: 10,
    });
    console.log(`🔌 PG via DATABASE_URL → host=${hostFromUrl(DATABASE_URL) ?? "?"} ssl=${useSSL ? "on" : "off"} env=dev`);
}
else if (DB_HOST && DB_USER && DB_NAME) {
    const useSSL = needSSLFromHost(DB_HOST);
    pool = new pg_1.default.Pool({
        host: DB_HOST,
        port: DB_PORT ? Number(DB_PORT) : 5432,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
        ssl: useSSL ? { rejectUnauthorized: false } : false,
        max: 10,
    });
    console.log(`🔌 PG via DB_* → host=${DB_HOST} port=${DB_PORT || 5432} ssl=${useSSL ? "on" : "off"} env=dev`);
}
else {
    throw new Error("❌ Není nastavena DB konfigurace (DATABASE_URL nebo DB_*).");
}
pool.on("error", (err) => {
    console.error("❌ Nezachycená chyba v PG poolu:", err);
});
exports.default = {
    query: (text, params) => pool.query(text, params),
    connect: () => pool.connect(),
    end: () => pool.end(),
};
