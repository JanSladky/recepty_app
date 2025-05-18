"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import useAdmin from "@/hooks/useAdmin";
import { useEffect, useState } from "react";

export default function Navbar() {
  const { isAdmin, loading } = useAdmin();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("userEmail"));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("userEmail");
    localStorage.removeItem("isAdmin");
    alert("Byl jsi odhlášen.");
    router.push("/");
    router.refresh(); // 👈 pro jistotu aktualizace zobrazení
  };

  return (
    <nav className="bg-white shadow p-4 flex justify-between items-center">
      <div className="flex gap-6">
        <Link href="/" className="hover:underline">
          Domů
        </Link>
        <Link href="/recepty" className="hover:underline">
          Recepty
        </Link>
        {!loading && isAdmin && (
          <Link href="/pridat-recept" className="hover:underline text-green-700 font-semibold">
            Přidat recept
          </Link>
        )}
      </div>

      <div className="flex gap-3">
        {!loading && isLoggedIn ? (
          <button onClick={handleLogout} className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition">
            Odhlásit se
          </button>
        ) : (
          <Link href="/login" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
            Přihlásit se
          </Link>
        )}
      </div>
    </nav>
  );
}
