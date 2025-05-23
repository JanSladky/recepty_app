"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import useAdmin from "@/hooks/useAdmin";
import { useEffect, useState } from "react";

export default function Navbar() {
  const router = useRouter();
  const { isAdmin, loading } = useAdmin();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    setIsLoggedIn(!!email);
    console.log("🔄 Přihlášen:", !!email, "| Admin:", isAdmin);
  }, [isAdmin]); // reaguj i na změnu admin statusu

  const handleLogout = () => {
    localStorage.removeItem("userEmail");
    localStorage.removeItem("isAdmin");
    alert("Byl jsi odhlášen.");
    router.push("/");
    window.location.reload(); // 👉 reload pro jistotu přepočtu hooku
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
          <>
            <Link href="/pridat-recept" className="hover:underline text-green-700 font-semibold">
              Přidat recept
            </Link>
            <Link href="/admin/suroviny" className="text-sm px-3 py-2 hover:underline">
              Suroviny
            </Link>
          </>
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
