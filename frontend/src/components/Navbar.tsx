// 📁 frontend/src/components/Navbar.tsx
"use client";

import { useEffect, useState } from "react";
import { User, Heart, ShoppingCart, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useAdmin from "@/hooks/useAdmin";
import { useAuth } from "@/context/AuthContext";

const CART_KEY = "shopping_cart_v1";

function getCartCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(CART_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.length : 0;
  } catch {
    return 0;
  }
}

export default function Navbar() {
  const router = useRouter();
  const { isAdmin, loading } = useAdmin(); // true pro ADMIN i SUPERADMIN
  const { isLoggedIn, userEmail, userAvatar } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const [isSuperadmin, setIsSuperadmin] = useState(false);

  // 🔢 badge košíku
  const [cartCount, setCartCount] = useState<number>(0);

  useEffect(() => {
    setIsSuperadmin(
      typeof window !== "undefined" && localStorage.getItem("userRole") === "SUPERADMIN"
    );

    // první načtení
    const update = () => setCartCount(getCartCount());
    update();

    // poslouchej na změny košíku z různých míst
    const onCartUpdated = () => update();
    const onStorage = (e: StorageEvent) => {
      if (e.key === CART_KEY) update();
    };
    const onVisibility = () => update();
    const onFocus = () => update();

    window.addEventListener("cartUpdated", onCartUpdated as EventListener);
    window.addEventListener("storage", onStorage);
    window.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("cartUpdated", onCartUpdated as EventListener);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userAvatar");
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

          {isLoggedIn && (
            <Link href="/dashboard" className="hover:underline">
              Dashboard
            </Link>
          )}

          <Link href="/recepty" className="hover:underline">
            Recepty
          </Link>

          {isLoggedIn && (
            <Link href="/oblibene" title="Oblíbené recepty">
              <Heart className="text-red-500 hover:scale-110 transition" />
            </Link>
          )}

          {/* 🛒 Košík s badge */}
          <Link href="/nakupni-seznam" title="Nákupní seznam" className="relative">
            <ShoppingCart className="text-green-600 hover:scale-110 transition" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 inline-flex items-center justify-center text-[10px] font-bold bg-green-600 text-white rounded-full w-4 h-4">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Admin menu – ADMIN i SUPERADMIN */}
          {!loading && isAdmin && (
            <div className="relative group flex items-center">
              <div
                className="p-2 hover:bg-gray-100 rounded-full transition cursor-pointer"
                aria-label="Admin menu"
              >
                <Settings className="w-6 h-6 text-gray-700" />
              </div>
              <div className="absolute right-0 top-10 w-56 bg-white shadow-lg rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition duration-200 z-50">
                {isLoggedIn && (
                  <Link href="/dashboard" className="block px-4 py-2 hover:bg-gray-100">
                    Dashboard
                  </Link>
                )}
                <Link href="/admin/cekajici-recepty" className="block px-4 py-2 hover:bg-gray-100">
                  Schvalování receptů
                </Link>
                {isSuperadmin && (
                  <Link href="/admin/users" className="block px-4 py-2 hover:bg-gray-100">
                    Správa uživatelů
                  </Link>
                )}
                <Link href="/pridat-recept" className="block px-4 py-2 hover:bg-gray-100">
                  Přidat recept
                </Link>
                <Link href="/admin/suroviny" className="block px-4 py-2 hover:bg-gray-100">
                  Suroviny
                </Link>
              </div>
            </div>
          )}

          {/* Profil / Login */}
          {isLoggedIn ? (
            <Link href="/profil" title="Profil">
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full object-cover border-2 border-blue-200 hover:scale-105 transition"
                />
              ) : (
                <div className="bg-blue-100 text-blue-800 font-bold rounded-full w-8 h-8 flex items-center justify-center text-sm hover:bg-blue-200 transition">
                  {userEmail?.charAt(0).toUpperCase() ?? "U"}
                </div>
              )}
            </Link>
          ) : (
            <Link href="/login" className="p-2 rounded hover:bg-gray-100 transition" title="Přihlásit se">
              <User className="w-6 h-6 text-blue-600" />
            </Link>
          )}
        </div>

        {/* Mobilní navigace */}
        <div className="md:hidden flex items-center gap-3">
          {isLoggedIn && (
            <Link href="/oblibene" title="Oblíbené recepty">
              <Heart className="w-5 h-5 text-red-500 hover:scale-110 transition" />
            </Link>
          )}

          <Link href="/nakupni-seznam" title="Nákupní seznam" className="relative">
            <ShoppingCart className="w-5 h-5 text-green-600 hover:scale-110 transition" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 inline-flex items-center justify-center text-[10px] font-bold bg-green-600 text-white rounded-full w-4 h-4">
                {cartCount}
              </span>
            )}
          </Link>

          {isLoggedIn ? (
            <Link href="/profil" title="Profil">
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full object-cover border-2 border-blue-200 hover:scale-105 transition"
                />
              ) : (
                <div className="bg-blue-100 text-blue-800 font-bold rounded-full w-8 h-8 flex items-center justify-center text-sm hover:bg-blue-200 transition">
                  {userEmail?.charAt(0).toUpperCase() ?? "U"}
                </div>
              )}
            </Link>
          ) : (
            <Link href="/login" className="p-2 rounded hover:bg-gray-100 transition" title="Přihlásit se">
              <User className="w-6 h-6 text-blue-600" />
            </Link>
          )}

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            className="flex flex-col justify-center items-end w-8 h-6 space-y-1"
          >
            <span className="block w-6 h-0.5 bg-gray-800 rounded" />
            <span className="block w-6 h-0.5 bg-gray-800 rounded" />
            <span className="block w-6 h-0.5 bg-gray-800 rounded" />
          </button>
        </div>
      </div>

      {/* Mobilní menu obsah */}
      {menuOpen && (
        <div className="md:hidden mt-4 flex flex-col gap-4 px-4">
          <Link href="/" onClick={() => setMenuOpen(false)} className="hover:underline py-3 text-lg">
            Domů
          </Link>

          {isLoggedIn && (
            <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="hover:underline py-3 text-lg">
              Dashboard
            </Link>
          )}

          <Link href="/recepty" onClick={() => setMenuOpen(false)} className="hover:underline py-3 text-lg">
            Recepty
          </Link>

          {isLoggedIn && (
            <Link href="/oblibene" onClick={() => setMenuOpen(false)} className="hover:underline py-3 text-lg">
              Oblíbené recepty
            </Link>
          )}

          <Link href="/nakupni-seznam" onClick={() => setMenuOpen(false)} className="hover:underline py-3 text-lg">
            Nákupní seznam
          </Link>

          {!loading && isAdmin && (
            <>
              <Link href="/admin/cekajici-recepty" onClick={() => setMenuOpen(false)} className="hover:underline py-3 text-lg">
                Schvalování receptů
              </Link>
              {isSuperadmin && (
                <Link href="/admin/users" onClick={() => setMenuOpen(false)} className="hover:underline py-3 text-lg">
                  Správa uživatelů
                </Link>
              )}
              <Link href="/pridat-recept" onClick={() => setMenuOpen(false)} className="hover:underline py-3 text-lg">
                Přidat recept
              </Link>
              <Link href="/admin/suroviny" onClick={() => setMenuOpen(false)} className="hover:underline py-3 text-lg">
                Suroviny
              </Link>
            </>
          )}

          {isLoggedIn ? (
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