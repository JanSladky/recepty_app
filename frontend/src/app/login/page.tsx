"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      alert("❗ Zadej e-mail i heslo.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const text = await res.text(); // načti odpověď jako text
      console.log("📄 Raw response text:", text);

      let data;
      try {
        data = JSON.parse(text); // pokus o převod na JSON
      } catch (err) {
        throw new Error("Odpověď serveru není platný JSON.");
      }

      if (!res.ok) {
        alert(`❌ ${data.message || "Chyba při přihlášení."}`);
        return;
      }

      const { token, user } = data;

      if (!token || !user) {
        throw new Error("Neplatná odpověď ze serveru.");
      }

      // ✅ Uložení dat
      localStorage.setItem("token", token);
      localStorage.setItem("userEmail", user.email);
      localStorage.setItem("isAdmin", user.is_admin ? "true" : "false");

      alert("✅ Přihlášení úspěšné.");
      window.location.href = "/"; // nebo např. /admin
    } catch (err: any) {
      console.error("❌ Chyba při přihlašování:", err);
      alert("❌ Nastala chyba: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Přihlášení</h1>

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Zadej e-mail"
        className="w-full p-2 border rounded mb-4"
        required
      />

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Zadej heslo"
        className="w-full p-2 border rounded mb-4"
        required
      />

      <button
        onClick={handleLogin}
        disabled={loading}
        className={`w-full bg-blue-600 text-white py-2 rounded transition ${
          loading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
        }`}
      >
        {loading ? "Přihlašuji..." : "Přihlásit se"}
      </button>
      <p className="text-sm mt-2">
  <a href="/reset-hesla" className="text-blue-600 hover:underline">
    Zapomněl/a jste heslo?
  </a>
</p>
    </main>
  );
}