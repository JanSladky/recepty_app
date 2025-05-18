"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const recipes_1 = __importDefault(require("./routes/recipes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// ✅ CORS middleware
const devOrigins = ["http://localhost:3000"];
const prodOrigins = [
    "https://recepty-app.vercel.app",
    "https://receptyapp-production.up.railway.app",
    process.env.FRONTEND_URL ?? "",
];
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        if (!origin)
            return callback(null, true);
        const isDev = process.env.NODE_ENV !== "production";
        const isAllowed = (isDev && devOrigins.includes(origin)) ||
            prodOrigins.includes(origin) ||
            /\.vercel\.app$/.test(origin);
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
// ✅ Middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// ✅ Root
app.get("/", (req, res) => {
    res.send("✅ API pro recepty je v provozu!");
});
// ✅ API
app.use("/api/recipes", recipes_1.default);
// ✅ Server
app.listen(PORT, () => {
    console.log(`✅ Server běží na http://localhost:${PORT}`);
});
