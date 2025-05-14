import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import router from "./routes/recipes";

dotenv.config();

const app = express();

// ✅ Načtení z .env
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const PORT = process.env.PORT || 5000;

// ✅ CORS middleware
app.use(
  cors({
    origin: FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  })
);

// ✅ Middleware pro JSON a URL encoded těla požadavků
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