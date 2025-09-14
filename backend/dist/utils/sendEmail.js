"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
// backend/src/utils/sendEmail.ts
const nodemailer_1 = __importDefault(require("nodemailer"));
const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT ?? 587);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
function createTransporter() {
    if (!host || !user || !pass) {
        console.warn("⚠️ SMTP není plně nastaven (SMTP_HOST/USER/PASS). E-maily se neodešlou.");
    }
    return nodemailer_1.default.createTransport({
        host,
        port,
        secure: port === 465, // SSL = 465
        auth: user && pass ? { user, pass } : undefined,
    });
}
async function sendEmail(to, subject, html) {
    const transporter = createTransporter();
    try {
        await transporter.sendMail({
            from: `"Recepty" <${process.env.SMTP_USER ?? "no-reply@recepty.app"}>`,
            to,
            subject,
            html,
        });
    }
    catch (err) {
        console.error("✉️  Odeslání e-mailu selhalo:", err);
    }
}
