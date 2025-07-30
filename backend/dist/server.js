"use strict";
// 📁 backend/src/server.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
// 📦 Import rout
const recipes_1 = __importDefault(require("./routes/recipes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const users_1 = __importDefault(require("./routes/users"));
const ingredients_1 = __importDefault(require("./routes/ingredients"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes")); // ✅ jen import
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8080;
// ✅ CORS nastavení
const devOrigins = ["http://localhost:3000"];
const prodOrigins = ["https://recepty-app.vercel.app", "https://receptyapp-production.up.railway.app", process.env.FRONTEND_URL ?? ""];
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        if (!origin)
            return callback(null, true);
        const isDev = process.env.NODE_ENV !== "production";
        const isAllowed = (isDev && devOrigins.includes(origin)) || prodOrigins.includes(origin) || /\.vercel\.app$/.test(origin);
        if (isAllowed) {
            callback(null, true);
        }
        else {
            console.warn("❌ Blokováno CORS:", origin);
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
}));
// 🔧 Middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// 🧪 Test
app.get("/", (_req, res) => res.send("✅ API pro recepty je v provozu!"));
// 📚 Připojení rout
app.use("/api/recipes", recipes_1.default);
app.use("/api/user", userRoutes_1.default);
app.use("/api/users", users_1.default);
app.use("/api/ingredients", ingredients_1.default);
app.use("/api/admin", adminRoutes_1.default); // ✅ připojeno správně
// 🌋 Globální error handler
app.use((err, req, res, _next) => {
    console.error("🔥 Globální serverová chyba:", err);
    res.status(err?.status || 500).json({ error: "Serverová chyba", detail: err?.message || "Neznámá chyba" });
});
// 🚀 Start
app.listen(PORT, () => {
    console.log(`✅ Server běží na http://localhost:${PORT}`);
});
