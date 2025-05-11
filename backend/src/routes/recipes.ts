import express from "express";
import multer from "multer";
import path from "path";
import {
  getRecipes,
  getRecipeById,
  addFullRecipe,
  updateRecipe,
  deleteRecipe,
} from "../controllers/recipeController";

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../../uploads"));
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// Routes
router.get("/", getRecipes);
router.get("/:id", getRecipeById);
router.post("/", upload.single("image"), addFullRecipe);
router.put("/:id", upload.single("image"), updateRecipe);
router.delete("/:id", deleteRecipe);

export default router;