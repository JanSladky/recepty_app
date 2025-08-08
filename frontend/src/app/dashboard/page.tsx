"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAdmin from "@/hooks/useAdmin";
import { useAuth } from "@/context/AuthContext";

type TileProps = {
  href: string;
  title: string;
  description: string;
  icon: string;
  allowed: boolean;
  disabledNote?: string;
};

const DashboardTile = ({ href, title, description, icon, allowed, disabledNote }: TileProps) => {
  const content = (
    <div
      className={`group block bg-white p-6 rounded-2xl shadow-md transition-all duration-300 ${
        allowed ? "hover:shadow-xl hover:-translate-y-1" : "opacity-50 cursor-not-allowed"
      }`}
      aria-disabled={!allowed}
    >
      <div className="text-4xl mb-3">{icon}</div>
      <h3
        className={`text-xl font-bold text-gray-800 ${
          allowed ? "group-hover:text-green-600 transition-colors" : ""
        }`}
      >
        {title}
      </h3>
      <p className="text-gray-500 text-sm mt-1">{description}</p>
      {!allowed && disabledNote && (
        <p className="text-xs text-red-500 mt-2">{disabledNote}</p>
      )}
    </div>
  );

  return allowed ? <Link href={href}>{content}</Link> : content;
};

export default function DashboardPage() {
  const router = useRouter();
  const { isAdmin, isSuperadmin, loading } = useAdmin();
  const { isLoggedIn } = useAuth();

  // Dashboard jen pro přihlášené
  useEffect(() => {
    if (!loading && !isLoggedIn) {
      router.push("/login");
    }
  }, [loading, isLoggedIn, router]);

  if (loading || isAdmin === null || isSuperadmin === null) {
    return <p className="text-center p-10">Načítání...</p>;
  }

  // Práva pro dlaždice
  const canAddRecipe = isLoggedIn;                 // USER+ (odesílá ke schválení)
  const canManageIngredients = !!isAdmin;          // ADMIN/SUPERADMIN
  const canManageUsers = !!isSuperadmin;           // jen SUPERADMIN

  return (
    <div className="bg-gray-50 min-h-screen">
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-800">Vítej zpět!</h1>
          <p className="text-lg text-gray-500 mt-2">Co dnes uvaříš?</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Všem přihlášeným smysluplné dlaždice */}
          <DashboardTile
            href="/oblibene"
            title="Oblíbené recepty"
            description="Tvoje uložené recepty označené srdíčkem."
            icon="❤️"
            allowed={true}
          />
          <DashboardTile
            href="/recepty"
            title="Všechny recepty"
            description="Procházej kompletní sbírku receptů."
            icon="📚"
            allowed={true}
          />
          <DashboardTile
            href="/nakupni-seznam"
            title="Nákupní seznam"
            description="Naplánuj si vaření a vytvoř si seznam."
            icon="🛒"
            allowed={true}
          />

          {/* USER+ (odeslání návrhu ke schválení) */}
          <DashboardTile
            href="/pridat-recept"
            title="Přidat nový recept"
            description="Vytvoř recept – půjde ke schválení, pokud nejsi admin."
            icon="➕"
            allowed={canAddRecipe}
            disabledNote={!canAddRecipe ? "Přihlaste se pro přidání receptu" : undefined}
          />

          {/* ADMIN/SUPERADMIN */}
          <DashboardTile
            href="/admin/suroviny"
            title="Správa surovin"
            description="Upravuj suroviny a jejich kategorie."
            icon="🥕"
            allowed={canManageIngredients}
            disabledNote={!canManageIngredients ? "Přístup pouze pro administrátora" : undefined}
          />

          {/* jen SUPERADMIN */}
          <DashboardTile
            href="/admin/users"
            title="Správa uživatelů"
            description="Prohlížej, upravuj nebo mazej uživatele aplikace."
            icon="🧑‍💼"
            allowed={canManageUsers}
            disabledNote={!canManageUsers ? "Přístup pouze pro superadmina" : undefined}
          />
        </div>
      </main>
    </div>
  );
}