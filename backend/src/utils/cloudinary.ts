import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

// Odstranili jsme import a volání `dotenv`, protože na produkčním serveru
// (Railway) se proměnné načítají automaticky z nastavení.

// Tato kontrola je v pořádku, nyní bude číst proměnné přímo od Railway.
if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  // Tato chyba se nyní správně zobrazí, pokud proměnné na Railway opravdu chybí.
  throw new Error("❌ Chybí Cloudinary environment proměnné na serveru.");
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
