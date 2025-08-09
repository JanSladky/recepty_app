// 📁 frontend/src/app/profil/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type UploadResponse = {
  avatar_url?: string;
  avatarUrl?: string;
  error?: string;
  message?: string;
};

export default function ProfilPage() {
  const router = useRouter();
  const { userEmail, login, logout, ready } = useAuth();

  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!ready) return; // ✅ Čekáme, dokud se nenačte stav z localStorage
    if (!userEmail) {
      router.push("/login");
      return;
    }
    const storedAvatar = localStorage.getItem("userAvatar");
    if (storedAvatar) setAvatarUrl(storedAvatar);
  }, [ready, userEmail, router]); // ✅ Přidán ready do dependency

  const handleUpload = async () => {
    if (!avatar || !userEmail) return;

    const formData = new FormData();
    formData.append("avatar", avatar);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/user/upload-avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token ?? ""}` },
        body: formData,
      });

      const text = await res.text();
      let data: UploadResponse;
      try {
        data = JSON.parse(text) as UploadResponse;
      } catch {
        throw new Error("Server nevrátil platné JSON.");
      }

      if (!res.ok) {
        throw new Error(data.error || data.message || "Chyba při nahrávání obrázku");
      }

      const newAvatarUrl = data.avatar_url || data.avatarUrl;
      if (!newAvatarUrl) throw new Error("Chybí URL nahraného avataru.");

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

  // ✅ Loader dokud se nenačte stav
  if (!ready) return <div className="p-10 text-center">Načítání profilu...</div>;
  if (!userEmail) return <div className="p-10 text-center">Nepřihlášený uživatel</div>;

  return (
    <div className="bg-gray-50 min-h-screen">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hlavička */}
        <header className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">Můj profil</h1>
          <p className="text-gray-500 mt-1">Uprav si avatar a zkontroluj své přihlašovací údaje.</p>
        </header>

        {/* Karta profilu */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6">
          {/* Horní řádek: avatar + email */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="relative w-32 h-32">
                {/* zvětšeno z w-20 h-20 */}
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="Avatar"
                    fill
                    className="rounded-full object-cover ring-2 ring-green-500/30"
                    sizes="128px"
                    unoptimized
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-3xl font-bold ring-2 ring-blue-200">
                    {userEmail.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm uppercase tracking-wider text-gray-500">Email</div>
                <div className="text-lg font-semibold text-gray-900 break-all">{userEmail}</div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg px-4 py-2.5 font-semibold bg-red-600 text-white hover:bg-red-700 transition shadow-sm"
            >
              Odhlásit se
            </button>
          </div>

          {/* Oddělovač */}
          <div className="my-6 border-t border-gray-200" />

          {/* Upload sekce */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2">
              <label htmlFor="avatar" className="block text-sm font-medium text-gray-700 mb-2">
                Změnit avatar
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAvatar(e.target.files?.[0] || null)}
                  className="file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:font-semibold
                             file:bg-green-50 file:text-green-700 hover:file:bg-green-100
                             w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
                />

                <button
                  onClick={handleUpload}
                  disabled={!avatar}
                  className="inline-flex items-center justify-center rounded-lg px-4 py-2.5 font-semibold
                             bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition shadow-sm"
                >
                  Nahrát nový avatar
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-2">Doporučení: čtvercový obrázek, ideálně 512×512&nbsp;px (JPG/PNG).</p>
            </div>

            {/* Náhled vybraného souboru (pouze když je zvolen) */}
            {avatar && (
              <div className="md:col-span-1">
                <div className="rounded-xl border border-gray-200 p-3 bg-gray-50">
                  <div className="text-xs text-gray-500 mb-2">Náhled</div>
                  <div className="relative w-28 h-28 mx-auto">
                    <Image
                      src={URL.createObjectURL(avatar)}
                      alt="Náhled avataru"
                      fill
                      className="rounded-full object-cover ring-1 ring-gray-200"
                      sizes="112px"
                      unoptimized
                    />
                  </div>
                  <div className="mt-2 text-center text-xs text-gray-600 break-all">{avatar.name}</div>
                </div>
              </div>
            )}
          </div>

          {/* Stavová zpráva */}
          {message && (
            <div
              className={`mt-5 rounded-lg px-4 py-3 text-sm ${
                message.startsWith("✅") ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {message}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}