// 📁 backend/src/server.ts

import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// 📦 Import rout
import recipeRoutes from "./routes/recipes";
import userRoutes from "./routes/userRoutes";
import usersRoute from "./routes/users";
import ingredientRoutes from "./routes/ingredients";
import adminRoutes from "./routes/adminRoutes"; // ✅ jen import

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// ✅ CORS nastavení
const devOrigins = ["http://localhost:3000"];
const prodOrigins = ["https://recepty-app.vercel.app", "https://receptyapp-production.up.railway.app", process.env.FRONTEND_URL ?? ""];

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

// 🔧 Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🧪 Test
app.get("/", (_req, res) => res.send("✅ API pro recepty je v provozu!"));

// 📚 Připojení rout
app.use("/api/recipes", recipeRoutes);
app.use("/api/user", userRoutes);
app.use("/api/users", usersRoute);
app.use("/api/ingredients", ingredientRoutes);
app.use("/api/admin", adminRoutes); // ✅ připojeno správně

// 🌋 Globální error handler
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("🔥 Globální serverová chyba:", err);
  res.status(err?.status || 500).json({ error: "Serverová chyba", detail: err?.message || "Neznámá chyba" });
});

// 🚀 Start
app.listen(PORT, () => {
  console.log(`✅ Server běží na http://localhost:${PORT}`);
});