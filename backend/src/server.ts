// 📁 backend/src/server.ts
import express, { type Request, type Response, type NextFunction } from "express";
import cors, { type CorsOptions } from "cors";
import dotenv from "dotenv";

dotenv.config({ override: true });

import recipeRoutes from "./routes/recipes";
import userRoutes from "./routes/userRoutes";
import usersRoute from "./routes/users";
import ingredientRoutes from "./routes/ingredients";
import adminRoutes from "./routes/adminRoutes";
import authRoutes from "./routes/authRoutes";
import offRoutes from "./routes/offRoutes";
import db from "./utils/db";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;

// ✅ CORS – whitelist domén
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://recepty-app.vercel.app",
  "https://receptyapp-production.up.railway.app",
];
if (process.env.FRONTEND_URL) allowedOrigins.push(process.env.FRONTEND_URL);

// jednotná CORS konfigurace
const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true); // např. curl / server-side
    const ok =
      allowedOrigins.includes(origin) ||
      /^https?:\/\/localhost(:\d+)?$/i.test(origin) ||
      /\.vercel\.app$/i.test(origin);
    if (ok) return callback(null, true);
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
app.use(cors(corsOptions));
// jistota pro preflight na všech cestách
app.options("*", cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🧪 Test
app.get("/", (_req, res) => res.send("✅ API pro recepty je v provozu!"));

// 📚 Routy – po middleware!
app.use("/api/auth", authRoutes);
app.use("/api/off", offRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/user", userRoutes);
app.use("/api/users", usersRoute);
app.use("/api/ingredients", ingredientRoutes);
app.use("/api/admin", adminRoutes);

// --- DEBUG DB INFO (dočasná pomocná route) ---
app.get("/api/_debug/db", async (_req, res) => {
  try {
    const r = await db.query(
      "select current_database() as db, inet_server_addr() as host, inet_server_port() as port"
    );
    res.json(r.rows[0]);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    res.status(500).json({ error: message });
  }
});

// 🌋 Globální error handler (typově bezpečný)
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : String(err);
  const status =
    err && typeof err === "object" && "status" in err ? Number((err as { status?: number }).status) : 500;

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