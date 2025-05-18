"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users/${email}`);
      if (!res.ok) {
        alert("Uživatel nenalezen.");
        return;
      }

      const user = await res.json();

      localStorage.setItem("userEmail", user.email);
      localStorage.setItem("isAdmin", user.is_admin ? "true" : "false");

      alert("✅ Přihlášení úspěšné.");
      router.push("/");
    } catch (err) {
      console.error("Chyba při přihlašování:", err);
      alert("Nastala chyba při přihlašování.");
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
      />
      <button
        onClick={handleLogin}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
      >
        Přihlásit se
      </button>
    </main>
  );
}