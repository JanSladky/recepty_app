"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const pg_1 = require("pg");
dotenv_1.default.config();
const isProduction = process.env.NODE_ENV === "production";
const connectionString = isProduction
    ? process.env.DATABASE_URL
    : "postgres://recepty:recepty123@localhost:5432/recepty_dev";
exports.db = new pg_1.Pool({
    connectionString,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
});
