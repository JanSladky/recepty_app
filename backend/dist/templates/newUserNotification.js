"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newUserNotification = newUserNotification;
function newUserNotification(name, email) {
    const appUrl = process.env.APP_URL ?? "https://recepty-app.vercel.app";
    return `
  <div style="background:#f3f4f6;padding:24px;font-family:Inter,Segoe UI,Arial,sans-serif;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 6px 18px rgba(0,0,0,0.06)">
      <!-- Hlavička -->
      <div style="background:#16a34a;padding:18px 24px;color:#fff;">
        <table width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="font-size:20px;font-weight:800;letter-spacing:.2px;color:#fff;">Recepty</td>
            <td align="right" style="font-size:12px;opacity:.9;">
              <a href="${appUrl}" style="color:#fff;text-decoration:none;">
                ${appUrl.replace(/^https?:\/\//, '')}
              </a>
            </td>
          </tr>
        </table>
      </div>
      <!-- Obsah -->
      <div style="padding:28px 24px;color:#111827;line-height:1.6;">
        <h3 style="margin:0 0 10px 0;color:#111827;">Nový registrovaný uživatel 🆕</h3>
        <table cellspacing="0" cellpadding="0" style="font-size:14px;color:#111827">
          <tr>
            <td style="padding:6px 0;width:120px;color:#6b7280">Jméno:</td>
            <td><strong>${name}</strong></td>
          </tr>
          <tr>
            <td style="padding:6px 0;width:120px;color:#6b7280">E-mail:</td>
            <td><a href="mailto:${email}">${email}</a></td>
          </tr>
        </table>
        <p style="margin-top:16px">
          <a href="${appUrl}/dashboard"
             style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:10px 14px;border-radius:8px;font-weight:600">
            Otevřít administraci
          </a>
        </p>
      </div>
      <!-- Patička -->
      <div style="background:#f9fafb;padding:18px 24px;color:#6b7280;font-size:12px;text-align:center;">
        © ${new Date().getFullYear()} Recepty – Všechna práva vyhrazena
      </div>
    </div>
  </div>
  `;
}
