export function newUserNotification(name: string, email: string) {
  return `
  <div style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <div style="background-color: #dc2626; padding: 20px; text-align: center; color:white;">
        <h2>Nový registrovaný uživatel</h2>
      </div>
      <div style="padding: 30px; color: #111827;">
        <p><strong>Jméno:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p style="margin-top:20px;">Podívej se na jeho profil v administraci.</p>
      </div>
    </div>
  </div>
  `;
}