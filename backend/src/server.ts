import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import router from "./routes/recipes";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

// ✅ CORS whitelist
const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL || "https://recepty-app.vercel.app",
];

// ✅ CORS middleware
app.use(
  cors({
    origin: function (origin, callback) {
      if (
        !origin || // povolit např. Postman / server-side
        allowedOrigins.includes(origin) || // běžné povolené domény
        /\.vercel\.app$/.test(origin) // všechny vercel preview deploymenty
      ) {
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

// ✅ API router
app.use("/api/recipes", router);

// ✅ Spuštění serveru
app.listen(PORT, () => {
  console.log(`✅ Server běží na http://localhost:${PORT}`);
});