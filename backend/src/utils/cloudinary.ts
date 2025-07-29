import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

// --- FINÁLNÍ OPRAVA ---
// Načteme .env soubor, POUZE pokud nejsme v produkčním prostředí (na serveru)
if (process.env.NODE_ENV !== "production") {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const dotenv = require("dotenv");
  dotenv.config();
}

// Tato kontrola je nyní univerzální pro lokální i produkční prostředí
if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  throw new Error("❌ Chybí Cloudinary environment proměnné. Zkontroluj .env soubor (lokálně) nebo nastavení na serveru (produkce).");
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
    format: "png",
    transformation: [{ width: 1200, crop: "limit" }],
  }),
});
