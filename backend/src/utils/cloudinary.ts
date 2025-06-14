// src/utils/cloudinary.ts
import dotenv from "dotenv";
dotenv.config();

import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  throw new Error("❌ Chybí Cloudinary environment proměnné. Zkontroluj .env soubor.");
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder: "recepty",
    public_id: `${Date.now()}-${file.originalname.split(".")[0]}`,
    resource_type: "image",
    format: "png", // nebo "auto"
    transformation: [{ width: 1200, crop: "limit" }],
  }),
});