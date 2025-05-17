import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import router from "./routes/recipes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Seznam povolených originů
const devOrigins = ["http://localhost:3000"];
const prodOrigins = [
  "https://recepty-app.vercel.app",
  "https://receptyapp-production.up.railway.app",
  process.env.FRONTEND_URL ?? "", // fallback pro jistotu
];

// ✅ CORS middleware
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // Povolit např. Postman / server-side

      const isDev = process.env.NODE_ENV !== "production";
      const isAllowed =
        (isDev && devOrigins.includes(origin)) ||
        prodOrigins.includes(origin) ||
        /\.vercel\.app$/.test(origin); // povolit i preview deploymenty z Vercelu

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

// ✅ Middleware pro JSON a formulářová data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Statické soubory pro obrázky
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ✅ Root endpoint pro ověření funkčnosti backendu
app.get("/", (req, res) => {
  res.send("✅ API pro recepty je v provozu!");
});

// ✅ API router
app.use("/api/recipes", router);

// ✅ Spuštění serveru
app.listen(PORT, () => {
  console.log(`✅ Server běží na http://localhost:${PORT}`);
});