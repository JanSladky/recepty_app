// 📁 frontend/src/components/RegisterForm.tsx

"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const RegisterForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    let avatar_url = "";

    // 🔼 Nahraj avatar na Cloudinary, pokud byl vybrán
    if (avatar) {
      const formData = new FormData();
      formData.append("file", avatar);
      formData.append("upload_preset", "ml_default"); // nebo vlastní preset, pokud používáš
      formData.append("cloud_name", "dzbykvmlc"); // tvůj cloud name

      try {
        const uploadRes = await fetch("https://api.cloudinary.com/v1_1/dzbykvmlc/image/upload", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadRes.json();
        console.log("📦 Cloudinary response:", uploadData); // ← uvidíš přesnou chybu

        if (!uploadData.secure_url) throw new Error("Chyba při nahrávání avataru.");
        avatar_url = uploadData.secure_url;
      } catch (err) {
        console.error("❌ Upload avatar error:", err);
        setMessage("❌ Nahrání avataru selhalo.");
        return;
      }
    }

    // 🔁 Odeslání dat na backend
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          avatar_url, // přidáme avatar_url
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registrace selhala");

      setMessage("✅ Registrace proběhla úspěšně!");
      setName("");
      setEmail("");
      setPassword("");
      setAvatar(null);
    } catch (err) {
      if (err instanceof Error) {
        setMessage("❌ " + err.message);
      } else {
        setMessage("❌ Neznámá chyba při registraci.");
      }
    }
  };
  return (
    <form onSubmit={handleRegister} className="space-y-4">
      <h2 className="text-xl font-bold">Registrace</h2>

      <input type="text" placeholder="Jméno" value={name} onChange={(e) => setName(e.target.value)} className="border p-2 w-full" required />
      <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} className="border p-2 w-full" required />
      <input type="password" placeholder="Heslo" value={password} onChange={(e) => setPassword(e.target.value)} className="border p-2 w-full" required />
      <input type="file" accept="image/*" onChange={(e) => setAvatar(e.target.files?.[0] || null)} className="border p-2 w-full" />
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
        Registrovat
      </button>

      {message && <p className="mt-2 text-sm">{message}</p>}
    </form>
  );
};

export default RegisterForm;
