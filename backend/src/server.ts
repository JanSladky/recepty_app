import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import recipeRoutes from "./routes/recipes";
import userRoutes from "./routes/users";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// ✅ CORS middleware
const devOrigins = ["http://localhost:3000"];
const prodOrigins = [
  "https://recepty-app.vercel.app",
  "https://receptyapp-production.up.railway.app",
  process.env.FRONTEND_URL ?? "",
];

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

// ✅ Parsování request těla
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Root endpoint
app.get("/", (req, res) => {
  res.send("✅ API pro recepty je v provozu!");
});

// ✅ API routy
app.use("/api/recipes", recipeRoutes); // 🍲 recepty
app.use("/api/users", userRoutes);     // 👤 uživatelé

// ✅ Spuštění serveru
app.listen(PORT, () => {
  console.log(`✅ Server běží na http://localhost:${PORT}`);
});