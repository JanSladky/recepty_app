"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const recipes_1 = __importDefault(require("./routes/recipes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// ✅ CORS whitelist
const allowedOrigins = [
    "http://localhost:3000",
    "https://recepty-app.vercel.app"
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Povolíme i požadavky z nástrojů bez originu (např. Postman)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
}));
// ✅ Middleware pro JSON a URL encoded těla požadavků
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// ✅ Statické soubory pro obrázky
app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "../uploads")));
// ✅ API router
app.use("/api/recipes", recipes_1.default);
// ✅ Spuštění serveru
app.listen(PORT, () => {
    console.log(`✅ Server běží na http://localhost:${PORT}`);
});
