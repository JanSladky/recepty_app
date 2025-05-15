import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import router from "./routes/recipes";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

// ✅ CORS whitelist
const allowedOrigins = [process.env.FRONTEND_URL || "http://localhost:3000"];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
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