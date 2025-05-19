import dotenv from "dotenv";
dotenv.config();

import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

// ❗ Validace proměnných prostředí
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  throw new Error("❌ Chybí Cloudinary environment proměnné. Zkontroluj .env soubor.");
}

// 🔧 Nastavení konfigurace Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 📦 Definice storage pro Multer
export const storage = new CloudinaryStorage({
  cloudinary,
  params: async () => ({
    folder: "recepty",
    allowed_formats: ["jpg", "jpeg", "png"],
    transformation: [{ width: 1200, crop: "limit" }], // volitelná optimalizace
  }),
});

export default cloudinary;
