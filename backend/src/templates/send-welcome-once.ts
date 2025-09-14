// scripts/send-welcome-once.ts
import "dotenv/config";
import { sendEmail } from "../utils/sendEmail";
import { welcomeEmail } from "./welcomeEmail"; // uprav cestu podle tvého projektu

async function main() {
  const recipients = [
   
    { name: "Jan Sladký", email: "jansladky92@gmail.com" }
  ];

  for (const r of recipients) {
    try {
      console.log(`📧 Posílám welcome email na ${r.email}…`);
      await sendEmail(r.email, "Vítej v Recepty", welcomeEmail(r.name));
      console.log(`✅ Odesláno: ${r.email}`);
    } catch (err) {
      console.error(`❌ Chyba při posílání na ${r.email}:`, err);
    }
  }

  console.log("Hotovo.");
}

main();