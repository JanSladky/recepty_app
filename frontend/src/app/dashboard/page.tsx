"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAdmin from "@/hooks/useAdmin";

type TileProps = {
  href: string;
  title: string;
  description: string;
  icon: string;
  allowed: boolean;
};

const DashboardTile = ({ href, title, description, icon, allowed }: TileProps) => {
  const content = (
    <div
      className={`group block bg-white p-6 rounded-2xl shadow-md transition-all duration-300 ${
        allowed ? "hover:shadow-xl hover:-translate-y-1" : "opacity-50 cursor-not-allowed"
      }`}
    >
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className={`text-xl font-bold text-gray-800 ${allowed ? "group-hover:text-green-600 transition-colors" : ""}`}>
        {title}
      </h3>
      <p className="text-gray-500 text-sm mt-1">{description}</p>
      {!allowed && <p className="text-xs text-red-500 mt-2">Přístup pouze pro administrátora</p>}
    </div>
  );

  return allowed ? <Link href={href}>{content}</Link> : content;
};

export default function DashboardPage() {
  const router = useRouter();
  const { isAdmin, isSuperadmin, loading } = useAdmin();

  useEffect(() => {
    const email = typeof window !== "undefined" ? localStorage.getItem("userEmail") : null;
    if (!email) router.push("/login");
  }, [router]);

  if (loading || isAdmin === null || isSuperadmin === null) {
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
          {/* Viditelné pro všechny */}
          <DashboardTile href="/oblibene" title="Oblíbené recepty" description="Tvoje uložené recepty označené srdíčkem." icon="❤️" allowed />
          <DashboardTile href="/recepty" title="Všechny recepty" description="Procházej kompletní sbírku receptů." icon="📚" allowed />
          <DashboardTile href="/nakupni-seznam" title="Nákupní seznam" description="Naplánuj si vaření a vytvoř si seznam." icon="🛒" allowed />

          {/* ADMIN i SUPERADMIN */}
          <DashboardTile href="/pridat-recept" title="Přidat nový recept" description="Vytvoř a sdílej nový recept s ostatními." icon="➕" allowed={!!isAdmin} />
          <DashboardTile href="/admin/suroviny" title="Správa surovin" description="Upravuj suroviny a jejich kategorie." icon="🥕" allowed={!!isAdmin} />

          {/* Pouze SUPERADMIN */}
          <DashboardTile href="/admin/users" title="Správa uživatelů" description="Prohlížej, upravuj nebo mazej uživatele aplikace." icon="🧑‍💼" allowed={!!isSuperadmin} />
        </div>
      </main>
    </div>
  );
}