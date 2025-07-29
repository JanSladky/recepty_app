import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// 📦 Import rout
import recipeRoutes from "./routes/recipes";
// ZMĚNA ZDE: Původně './routes/users', nyní správně odkazuje na náš nový soubor
import userRoutes from "./routes/userRoutes"; 
import ingredientRoutes from "./routes/ingredients";

dotenv.config(); // 🔑 Načti .env proměnné

const app = express();
const PORT = process.env.PORT || 8080;

// 🌍 Povolené CORS původy
const devOrigins = ["http://localhost:3000"];
const prodOrigins = [
  "https://recepty-app.vercel.app",
  "https://receptyapp-production.up.railway.app",
  process.env.FRONTEND_URL ?? "",
];

// 🔐 CORS nastavení
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      const isDev = process.env.NODE_ENV !== "production";
      const isAllowed =
        (isDev && devOrigins.includes(origin)) ||
        prodOrigins.includes(origin) ||
        /\.vercel\.app$/.test(origin);

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
// ZMĚNA ZDE: Původně '/api/users', nyní správně '/api/user', aby to odpovídalo našemu plánu
app.use("/api/user", userRoutes); 
app.use("/api/ingredients", ingredientRoutes);

// ⚠️ Globální error handler – musí být až *po* všech routách!
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("🔥 Globální serverová chyba:", err);

  // Pokud je to instance Error, extrahuj message
  const errorMessage = err?.message || "Neznámá chyba";
  const status = err?.status || 500;

  res.status(status).json({ error: "Serverová chyba", detail: errorMessage });
});

// 🚀 Spuštění serveru
app.listen(PORT, () => {
  console.log(`✅ Server běží na http://localhost:${PORT}`);
});
