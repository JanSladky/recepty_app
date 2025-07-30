"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleResetPassword = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(`❌ ${data.error || data.message || "Chyba při změně hesla"}`);
        return;
      }

      setMessage("✅ Heslo bylo úspěšně změněno.");
      setEmail("");
      setNewPassword("");
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("❌ Chyba při změně hesla:", err.message);
        setMessage("❌ " + err.message);
      } else {
        console.error("❌ Neznámá chyba při změně hesla:", err);
        setMessage("❌ Nastala neznámá chyba při změně hesla.");
      }
    }
  };

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Reset hesla</h1>

      {message && (
        <div
          className={`mb-4 p-2 rounded ${
            message.startsWith("✅")
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

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
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="Nové heslo"
        className="w-full p-2 border rounded mb-4"
        required
      />
      <button
        onClick={handleResetPassword}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
      >
        Resetovat heslo
      </button>
    </main>
  );
}