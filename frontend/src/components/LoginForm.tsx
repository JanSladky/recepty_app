"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const LoginForm = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const loginUrl = `${API_URL}/api/user/login`;

    try {
      const res = await fetch(loginUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Přihlášení selhalo");
      }

      // 🔐 Uložení dat do localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("userEmail", data.user.email);
      localStorage.setItem("isAdmin", data.user.is_admin ? "true" : "false");

      setMessage("✅ Přihlášení úspěšné");

      // ✅ Přesměrování na dashboard
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof Error) {
        setMessage("❌ " + err.message);
      } else {
        setMessage("❌ Neznámá chyba při přihlášení.");
      }
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <h2 className="text-xl font-bold">Přihlášení</h2>

      <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} className="border p-2 w-full" required />
      <input type="password" placeholder="Heslo" value={password} onChange={(e) => setPassword(e.target.value)} className="border p-2 w-full" required />
      <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">
        Přihlásit se
      </button>

      {message && <p className="mt-2 text-sm">{message}</p>}
      <p className="text-sm mt-4">
        Nemáte účet?{" "}
        <a href="/register" className="text-blue-500 underline">
          Zaregistrovat se
        </a>
      </p>
      <p className="text-sm">
        <a href="/reset-hesla" className="text-blue-600 hover:underline">
          Zapomněl/a jste heslo?
        </a>
      </p>
    </form>
  );
};

export default LoginForm;
