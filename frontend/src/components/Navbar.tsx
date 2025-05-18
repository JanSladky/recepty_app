"use client";

import Link from "next/link";
import useAdmin from "@/hooks/useAdmin";

export default function Navbar() {
  const { isAdmin, loading } = useAdmin();

  return (
    <nav className="bg-white shadow p-4 flex justify-between items-center">
      {/* Levá část navigace */}
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

      {/* Pravá část navigace */}
      <div>
        <Link
          href="/login"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Přihlásit se
        </Link>
      </div>
    </nav>
  );
}