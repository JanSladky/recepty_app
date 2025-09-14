// 📁 backend/src/server.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// ⚠️ .env má přepsat vše, co je v shellu (staré exporty)
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

// 🔧 Middleware
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
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
  })
);
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
  } catch (e: any) {
    res.status(500).json({ error: e?.message || String(e) });
  }
});

// 🌋 Globální error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("🔥 Globální serverová chyba:", err);
  res
    .status(err?.status || 500)
    .json({ error: "Serverová chyba", detail: err?.message || "Neznámá chyba" });
});

// 🚀 Start
app.listen(PORT, () => {
  console.log(`✅ Server běží na http://localhost:${PORT}`);
});