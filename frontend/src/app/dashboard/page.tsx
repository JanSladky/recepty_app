"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAdmin from "@/hooks/useAdmin";

// --- Komponenta pro dlaždici ---
const DashboardTile = ({ href, title, description, icon }: { href: string; title: string; description: string; icon: string }) => (
  <Link href={href} className="group block bg-white p-6 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
    <div className="text-4xl mb-3">{icon}</div>
    <h3 className="text-xl font-bold text-gray-800 group-hover:text-green-600 transition-colors">{title}</h3>
    <p className="text-gray-500 text-sm mt-1">{description}</p>
  </Link>
);

export default function DashboardPage() {
  const router = useRouter();
  const { isAdmin, loading } = useAdmin();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    setUserEmail(email);

    // ⛔️ Přesměrování pokud uživatel není přihlášen nebo není admin
    if (!email || (!loading && isAdmin === false)) {
      router.push("/login");
    }
  }, [loading, isAdmin]);

  // ⏳ Načítání
  if (loading || isAdmin === null) {
    return <p className="text-center p-10">Načítání...</p>;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-800">Vítej zpět!</h1>
          <p className="text-lg text-gray-500 mt-2">Co dnes uvaříš?</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <DashboardTile href="/oblibene" title="Oblíbené recepty" description="Tvoje uložené recepty označené srdíčkem." icon="❤️" />
          <DashboardTile href="/recepty" title="Všechny recepty" description="Procházej kompletní sbírku receptů." icon="📚" />
          <DashboardTile href="/nakupni-seznam" title="Nákupní seznam" description="Naplánuj si vaření a vytvoř si seznam." icon="🛒" />

          {/* Dlaždice pouze pro adminy */}
          {isAdmin && (
            <>
              <DashboardTile href="/pridat-recept" title="Přidat nový recept" description="Vytvoř a sdílej nový recept s ostatními." icon="➕" />
              <DashboardTile href="/admin/suroviny" title="Správa surovin" description="Upravuj suroviny a jejich kategorie." icon="🥕" />
              <DashboardTile href="/admin/users" title="Správa uživatelů" description="Prohlížej, upravuj nebo mazej uživatele aplikace." icon="🧑‍💼" />
            </>
          )}
        </div>
      </main>
    </div>
  );
}