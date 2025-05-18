"use client";

import { useState } from "react";

type Props = {
  onLogin: (email: string) => void;
};

export default function LoginForm({ onLogin }: Props) {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      localStorage.setItem("userEmail", email);
      onLogin(email);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-sm mx-auto space-y-4">
      <h2 className="text-xl font-semibold">Přihlášení</h2>
      <input
        type="email"
        placeholder="Zadej svůj e-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full border px-3 py-2 rounded"
        required
      />
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded w-full">
        Přihlásit se
      </button>
    </form>
  );
}