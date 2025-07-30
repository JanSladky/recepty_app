"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const pg_1 = require("pg");
dotenv_1.default.config();
const connectionString = process.env.DATABASE_URL || "postgres://recepty:recepty123@localhost:5432/recepty_dev";
const pool = new pg_1.Pool({
    connectionString,
    ssl: connectionString.includes("railway") ? { rejectUnauthorized: false } : undefined,
});
const db = {
    query: (text, params) => pool.query(text, params),
    connect: () => pool.connect(),
};
exports.default = db;
