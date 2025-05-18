"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const router = useRouter();

  const handleLogin = () => {
    if (email.trim() !== "") {
      localStorage.setItem("userEmail", email);
      router.push("/"); // přesměruj na homepage
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
        className="w-full bg-green-600 text-white py-2 rounded"
      >
        Přihlásit se
      </button>
    </main>
  );
}