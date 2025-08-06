"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfilPage() {
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("userEmail");
    if (!stored) {
      router.push("/login");
    } else {
      setEmail(stored);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("userEmail");
    localStorage.removeItem("isAdmin");
    alert("Byl jsi odhlášen.");
    router.push("/");
    window.location.reload();
  };

  if (!email) return <div className="p-10 text-center">Načítání profilu...</div>;

  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">Můj profil</h1>
      <p className="mb-6"><strong>Email:</strong> {email}</p>
      <button
        onClick={handleLogout}
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition"
      >
        Odhlásit se
      </button>
    </div>
  );
}