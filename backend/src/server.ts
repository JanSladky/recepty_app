// 📁 Umístění: backend/src/server.ts

import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// 📦 Import rout
import recipeRoutes from "./routes/recipes";
import userRoutes from "./routes/userRoutes"; // Obsahuje: přihlášení, oblíbené, nákupní seznam
import usersRoute from "./routes/users"; // Obsahuje: vyhledávání uživatele podle emailu
import ingredientRoutes from "./routes/ingredients";
import adminRoutes from "./routes/adminRoutes";

dotenv.config(); // 🔑 Načti .env proměnné.

const app = express();
const PORT = process.env.PORT || 8080;

// 🌍 Povolené CORS původy
const devOrigins = ["http://localhost:3000"];
const prodOrigins = ["https://recepty-app.vercel.app", "https://receptyapp-production.up.railway.app", process.env.FRONTEND_URL ?? ""];

// 🔐 CORS nastavení
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      const isDev = process.env.NODE_ENV !== "production";
      const isAllowed = (isDev && devOrigins.includes(origin)) || prodOrigins.includes(origin) || /\.vercel\.app$/.test(origin);

      if (isAllowed) {
        callback(null, true);
      } else {
        console.warn("❌ Blokováno CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// 🧠 Middleware pro JSON a form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🧪 Testovací endpoint
app.get("/", (_req, res) => {
  res.send("✅ API pro recepty je v provozu!");
});

// 📚 Různé routy
app.use("/api/recipes", recipeRoutes);
app.use("/api/user", userRoutes); // obsahuje /login, /favorites, ...
app.use("/api/users", usersRoute); // obsahuje /email?email=...
app.use("/api/ingredients", ingredientRoutes);

// ⚠️ Globální error handler – musí být až *po* všech routách!
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("🔥 Globální serverová chyba:", err);

  const errorMessage = err?.message || "Neznámá chyba";
  const status = err?.status || 500;

  res.status(status).json({ error: "Serverová chyba", detail: errorMessage });
});
app.use("/api/admin", adminRoutes);

// 🚀 Spuštění serveru
app.listen(PORT, () => {
  console.log(`✅ Server běží na http://localhost:${PORT}`);
});
