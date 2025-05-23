import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import recipeRoutes from "./routes/recipes";
import userRoutes from "./routes/users";
import ingredientRoutes from "./routes/ingredients"; // ✅ přidáno

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("✅ API pro recepty je v provozu!");
});

app.use("/api/recipes", recipeRoutes);
app.use("/api/users", userRoutes);
app.use("/api/ingredients", ingredientRoutes); // ✅ nově přidaná surovinová routa

app.listen(PORT, () => {
  console.log(`✅ Server běží na http://localhost:${PORT}`);
});