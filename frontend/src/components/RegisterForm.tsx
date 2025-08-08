// 📁 frontend/src/components/RegisterForm.tsx
"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "dzbykvmlc";
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET ?? "ml_default";

type CloudinaryResponse = {
  secure_url?: string;
  error?: { message?: string };
  message?: string;
};

type BackendRegisterResponse = {
  error?: string;
  message?: string;
};

const RegisterForm = () => {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [message, setMessage] = useState<string>("");

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    let avatar_url = "";

    // 🔼 Nahraj avatar na Cloudinary, pokud byl vybrán
    if (avatar) {
      const formData = new FormData();
      formData.append("file", avatar);
      formData.append("upload_preset", UPLOAD_PRESET);

      try {
        const uploadRes = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
          { method: "POST", body: formData }
        );

        const uploadData: CloudinaryResponse = await uploadRes.json();
        console.log("📦 Cloudinary response:", uploadData);

        if (!uploadRes.ok) {
          throw new Error(
            uploadData.error?.message || uploadData.message || "Chyba při nahrávání avataru."
          );
        }
        if (!uploadData.secure_url) {
          throw new Error("Cloudinary nevrátil URL nahraného souboru.");
        }

        avatar_url = uploadData.secure_url;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Neznámá chyba při nahrávání avataru.";
        console.error("❌ Upload avatar error:", err);
        setMessage("❌ " + msg);
        return;
      }
    }

    // 🔁 Odeslání dat na backend
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, avatar_url }),
      });

      const text = await res.text();
      let data: BackendRegisterResponse = {};
      try {
        data = JSON.parse(text) as BackendRegisterResponse;
      } catch {
        // nevalidní JSON – necháme data prázdná a vezmeme hlášku ze statusu
      }

      if (!res.ok) {
        throw new Error(data.error || "Registrace selhala.");
      }

      setMessage("✅ Registrace proběhla úspěšně!");
      setName("");
      setEmail("");
      setPassword("");
      setAvatar(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Neznámá chyba při registraci.";
      setMessage("❌ " + msg);
    }
  };

  return (
    <form onSubmit={handleRegister} className="space-y-4">
      <h2 className="text-xl font-bold">Registrace</h2>

      <input
        type="text"
        placeholder="Jméno"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border p-2 w-full"
        required
      />
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

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setAvatar(e.target.files?.[0] || null)}
        className="border p-2 w-full"
      />

      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
        Registrovat
      </button>

      {message && <p className="mt-2 text-sm">{message}</p>}
    </form>
  );
};

export default RegisterForm;