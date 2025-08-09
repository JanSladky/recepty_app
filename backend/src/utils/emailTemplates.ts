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

export function welcomeEmail(userName: string) {
  return `
  <div style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <div style="background-color: #16a34a; padding: 20px; text-align: center;">
        <img src="https://recepty-app.vercel.app/logo.png" alt="Recepty Logo" style="height:50px;"/>
      </div>
      <div style="padding: 30px; color: #111827;">
        <h2 style="color:#16a34a;">Vítej, ${userName}!</h2>
        <p>Děkujeme za registraci na <strong>Recepty</strong>. Jsme rádi, že vaříš s námi! 🍲</p>
        <p>Klikni na tlačítko níže a objev všechny funkce:</p>
        <a href="https://recepty-app.vercel.app/dashboard" style="display:inline-block; margin-top:20px; padding:12px 24px; background-color:#16a34a; color:white; border-radius:6px; text-decoration:none;">Přejít na Dashboard</a>
        <p style="margin-top:30px; font-size: 12px; color:#6b7280;">Pokud jsi se neregistroval ty, ignoruj tento e-mail.</p>
      </div>
    </div>
  </div>
  `;
}