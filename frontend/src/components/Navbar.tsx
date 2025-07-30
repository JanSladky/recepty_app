"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import useAdmin from "@/hooks/useAdmin";
import { useEffect, useState } from "react";

export default function Navbar() {
  const router = useRouter();
  const { isAdmin, loading } = useAdmin();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    setIsLoggedIn(!!email);
  }, [isAdmin]);

  const handleLogout = () => {
    localStorage.removeItem("userEmail");
    localStorage.removeItem("isAdmin");
    alert("Byl jsi odhlášen.");
    router.push("/");
    window.location.reload();
  };

  return (
    <nav className="bg-white shadow p-4">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        {/* Logo */}

        <Link href="/" className="font-bold text-green-600 text-xl">
          🍽 Recepty
        </Link>

        {/* Desktop navigace */}
        <div className="hidden md:flex gap-6 items-center">
          <Link href="/" className="hover:underline">
            Domů
          </Link>
          <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="hover:underline py-3 text-lg">
            Dashboard
          </Link>
          <Link href="/recepty" className="hover:underline">
            Recepty
          </Link>
          <Link href="/admin/users" className="hover:underline">
  Správa uživatelů
</Link>
          {!loading && isAdmin && (
            <>
              <Link href="/pridat-recept" className="hover:underline">
                Přidat recept
              </Link>
              <Link href="/admin/suroviny" className="hover:underline">
                Suroviny
              </Link>
            </>
          )}
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

        {/* Mobilní burger vpravo */}
        <div className="md:hidden flex items-center gap-2">
          <button onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu" className="flex flex-col justify-center items-end w-8 h-6 space-y-1">
            <span className="block w-8 h-1 bg-gray-800 rounded" />
            <span className="block w-8 h-1 bg-gray-800 rounded" />
            <span className="block w-8 h-1 bg-gray-800 rounded" />
          </button>
        </div>
      </div>

      {/* Mobilní menu s větším odsazením */}
      {menuOpen && (
        <div className="md:hidden mt-4 flex flex-col gap-4 px-4">
          <Link href="/" onClick={() => setMenuOpen(false)} className="hover:underline py-3 text-lg">
            Domů
          </Link>
          <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="hover:underline py-3 text-lg">
            Dashboard
          </Link>
          <Link href="/recepty" onClick={() => setMenuOpen(false)} className="hover:underline py-3 text-lg">
            Recepty
          </Link>
          {!loading && isAdmin && (
            <>
              <Link href="/pridat-recept" onClick={() => setMenuOpen(false)} className="hover:underline py-3 text-lg">
                Přidat recept
              </Link>
              <Link href="/admin/suroviny" onClick={() => setMenuOpen(false)} className="hover:underline py-3 text-lg">
                Suroviny
              </Link>
            </>
          )}
          {!loading && isLoggedIn ? (
            <button
              onClick={() => {
                setMenuOpen(false);
                handleLogout();
              }}
              className="bg-gray-300 text-gray-800 px-4 py-3 rounded hover:bg-gray-400 transition text-lg"
            >
              Odhlásit se
            </button>
          ) : (
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="bg-blue-600 text-white px-4 py-3 rounded hover:bg-blue-700 transition text-lg text-center"
            >
              Přihlásit se
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
