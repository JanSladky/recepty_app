import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import router from "./routes/recipes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

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

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Root
app.get("/", (req, res) => {
  res.send("✅ API pro recepty je v provozu!");
});

// ✅ API
app.use("/api/recipes", router);

// ✅ Server
app.listen(PORT, () => {
  console.log(`✅ Server běží na http://localhost:${PORT}`);
});