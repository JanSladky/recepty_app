// 📁 src/components/LoginForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

type Role = "SUPERADMIN" | "ADMIN" | "USER";

type LoginResponse = {
  token: string;
  user: {
    id: number;
    name: string | null;
    email: string;
    avatar_url: string | null;
    role: Role;
  };
  message?: string;
  error?: string;
};

export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");
    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const text = await res.text();
      let data: LoginResponse;
      try {
        data = JSON.parse(text) as LoginResponse;
      } catch {
        throw new Error("Server vrátil neplatnou odpověď.");
      }

      if (!res.ok) {
        throw new Error(data.error || "Přihlášení selhalo.");
      }

      // 🔐 Uložení do localStorage (role místo is_admin)
      localStorage.setItem("token", data.token);
      localStorage.setItem("userEmail", data.user.email);
      localStorage.setItem("userRole", data.user.role);
      if (data.user.avatar_url) {
        localStorage.setItem("userAvatar", data.user.avatar_url);
      } else {
        localStorage.removeItem("userAvatar");
      }

      // ✅ AuthContext – vždy předáme string (i když je prázdný)
      login(data.user.email, data.user.avatar_url || "");

      setMessage("✅ Přihlášení úspěšné. Přesměrovávám…");
      router.replace("/dashboard");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Neznámá chyba při přihlášení.";
      setMessage("❌ " + msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <h2 className="text-xl font-bold">Přihlášení</h2>

      <input
        type="email"
        placeholder="E-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border p-2 w-full"
        required
      />
      <input
        type="password"
        placeholder="Heslo"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border p-2 w-full"
        required
      />

      <button
        type="submit"
        className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
        disabled={submitting}
      >
        {submitting ? "Přihlašuji…" : "Přihlásit se"}
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
}