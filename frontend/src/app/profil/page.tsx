"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ProfilPage() {
  const router = useRouter();

  // ✅ použijeme useAuth **jen jednou** a vytáhneme vše, co potřebujeme
  const { userEmail, login, logout } = useAuth();

  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!userEmail) {
      router.push("/login");
      return;
    }
    // načti případný avatar z localStorage (po loginu / po minulém uploadu)
    const storedAvatar = localStorage.getItem("userAvatar");
    if (storedAvatar) setAvatarUrl(storedAvatar);
  }, [userEmail, router]);

  const handleUpload = async () => {
    if (!avatar || !userEmail) return;

    const formData = new FormData();
    formData.append("avatar", avatar);

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_URL}/api/user/upload-avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token ?? ""}`,
        },
        body: formData,
      });

      // robustní parsování odpovědi
      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Server nevrátil platné JSON.");
      }

      if (!res.ok) {
        throw new Error(data.error || data.message || "Chyba při nahrávání obrázku");
      }

      // ✅ sjednocení názvu klíče z backendu
      const newAvatarUrl = data.avatar_url || data.avatarUrl;
      if (!newAvatarUrl) throw new Error("Chybí URL nahraného avataru.");

      // ✅ uložit a dát vědět AuthContextu, aby se Navbar hned překreslil
      localStorage.setItem("userAvatar", newAvatarUrl);
      login(userEmail, newAvatarUrl);

      setAvatarUrl(newAvatarUrl);
      setAvatar(null);
      setMessage("✅ Avatar byl úspěšně aktualizován.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Neočekávaná chyba";
      setMessage("❌ " + msg);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
    window.location.reload();
  };

  if (!userEmail) return <div className="p-10 text-center">Načítání profilu...</div>;

  return (
    <div className="max-w-xl mx-auto p-8 space-y-4">
      <h1 className="text-3xl font-bold mb-4">Můj profil</h1>

      {avatarUrl ? (
        <img src={avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full object-cover" />
      ) : (
        <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xl font-bold">
          {userEmail.charAt(0).toUpperCase()}
        </div>
      )}

      <p>
        <strong>Email:</strong> {userEmail}
      </p>

      <div className="flex items-center gap-2">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setAvatar(e.target.files?.[0] || null)}
        />
        <button
          onClick={handleUpload}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
        >
          Nahrát nový avatar
        </button>
      </div>

      {message && <p className="text-sm mt-2">{message}</p>}

      <button
        onClick={handleLogout}
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition"
      >
        Odhlásit se
      </button>
    </div>
  );
}