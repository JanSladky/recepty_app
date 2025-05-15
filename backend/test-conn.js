"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const db = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});
async function testConnection() {
    try {
        const res = await db.query("SELECT NOW()");
        console.log("✅ Připojeno k DB:", res.rows[0]);
    }
    catch (err) {
        console.error("❌ Chyba při připojení k DB:", err);
    }
    finally {
        await db.end();
    }
}
testConnection();
