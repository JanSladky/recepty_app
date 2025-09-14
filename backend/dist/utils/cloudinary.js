"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storage = exports.cloudinary = void 0;
const cloudinary_1 = require("cloudinary");
Object.defineProperty(exports, "cloudinary", { enumerable: true, get: function () { return cloudinary_1.v2; } });
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
// --- FINÁLNÍ OPRAVA ---
// Načteme .env soubor, POUZE pokud nejsme v produkčním prostředí (na serveru)
if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const dotenv = require("dotenv");
    dotenv.config();
}
// Tato kontrola je nyní univerzální pro lokální i produkční prostředí
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error("❌ Chybí Cloudinary environment proměnné. Zkontroluj .env soubor (lokálně) nebo nastavení na serveru (produkce).");
}
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
exports.storage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.v2,
    params: (req, file) => ({
        folder: "recepty",
        public_id: `${Date.now()}-${file.originalname.split(".")[0]}`,
        resource_type: "image",
        format: "png",
        transformation: [{ width: 1200, crop: "limit" }],
    }),
});
