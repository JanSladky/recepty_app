"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// scripts/send-welcome-once.ts
require("dotenv/config");
const sendEmail_1 = require("../utils/sendEmail");
const welcomeEmail_1 = require("./welcomeEmail"); // uprav cestu podle tvého projektu
async function main() {
    const recipients = [
        { name: "Jan Sladký", email: "jansladky92@gmail.com" }
    ];
    for (const r of recipients) {
        try {
            console.log(`📧 Posílám welcome email na ${r.email}…`);
            await (0, sendEmail_1.sendEmail)(r.email, "Vítej v Recepty", (0, welcomeEmail_1.welcomeEmail)(r.name));
            console.log(`✅ Odesláno: ${r.email}`);
        }
        catch (err) {
            console.error(`❌ Chyba při posílání na ${r.email}:`, err);
        }
    }
    console.log("Hotovo.");
}
main();
