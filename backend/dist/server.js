"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// 📁 backend/src/server.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ override: true });
const recipes_1 = __importDefault(require("./routes/recipes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const users_1 = __importDefault(require("./routes/users"));
const ingredients_1 = __importDefault(require("./routes/ingredients"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const offRoutes_1 = __importDefault(require("./routes/offRoutes"));
const db_1 = __importDefault(require("./utils/db"));
const app = (0, express_1.default)();
const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;
// ✅ CORS – whitelist domén
const allowedOrigins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://recepty-app.vercel.app",
    "https://receptyapp-production.up.railway.app",
];
if (process.env.FRONTEND_URL)
    allowedOrigins.push(process.env.FRONTEND_URL);
// jednotná CORS konfigurace
const corsOptions = {
    origin(origin, callback) {
        if (!origin)
            return callback(null, true); // např. curl / server-side
        const ok = allowedOrigins.includes(origin) ||
            /^https?:\/\/localhost(:\d+)?$/i.test(origin) ||
            /\.vercel\.app$/i.test(origin);
        if (ok)
            return callback(null, true);
        console.warn("❌ Blokováno CORS:", origin);
        return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    optionsSuccessStatus: 200,
    // povolíme hlavičky, které používáš (Authorization, Content-Type)
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
};
// 🔧 Middleware
app.use((req, res, next) => {
    // pomáhá CDN/proxy správně cachovat podle Origin
    res.setHeader("Vary", "Origin");
    next();
});
app.use((0, cors_1.default)(corsOptions));
// jistota pro preflight na všech cestách
app.options(/.*/, (0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// 🧪 Test
app.get("/", (_req, res) => res.send("✅ API pro recepty je v provozu!"));
// 📚 Routy – po middleware!
app.use("/api/auth", authRoutes_1.default);
app.use("/api/off", offRoutes_1.default);
app.use("/api/recipes", recipes_1.default);
app.use("/api/user", userRoutes_1.default);
app.use("/api/users", users_1.default);
app.use("/api/ingredients", ingredients_1.default);
app.use("/api/admin", adminRoutes_1.default);
// --- DEBUG DB INFO (dočasná pomocná route) ---
app.get("/api/_debug/db", async (_req, res) => {
    try {
        const r = await db_1.default.query("select current_database() as db, inet_server_addr() as host, inet_server_port() as port");
        res.json(r.rows[0]);
    }
    catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        res.status(500).json({ error: message });
    }
});
// 🌋 Globální error handler (typově bezpečný)
app.use((err, _req, res, _next) => {
    const message = err instanceof Error ? err.message : String(err);
    const status = err && typeof err === "object" && "status" in err ? Number(err.status) : 500;
    console.error("🔥 Globální serverová chyba:", message);
    res.status(Number.isFinite(status) && status > 0 ? status : 500).json({
        error: "Serverová chyba",
        detail: message || "Neznámá chyba",
    });
});
// 🚀 Start
app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server běží na http://0.0.0.0:${PORT}`);
});
