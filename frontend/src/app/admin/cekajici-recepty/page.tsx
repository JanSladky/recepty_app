"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type PendingItem = {
  id: number;
  title: string;
  image_url?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  created_at?: string;
  created_by_email?: string;
};

export default function PendingListPage() {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${API_URL}/api/recipes/pending/list`, { headers });
        if (!res.ok) throw new Error("Načtení pending receptů selhalo");
        const data = await res.json();
        setItems(data);
      } catch (e) {
        console.error(e);
        alert("❌ Nepodařilo se načíst čekající recepty.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <p className="p-6">Načítání…</p>;

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Čekající recepty</h1>
      {items.length === 0 ? (
        <p>Žádné čekající recepty.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((r) => (
            <li key={r.id} className="bg-white rounded shadow p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold">{r.title}</div>
                <div className="text-sm text-gray-500">
                  {r.created_by_email ? `Autor: ${r.created_by_email} • ` : ""}
                  {r.status}
                </div>
              </div>
              <Link
                href={`/admin/cekajici-recepty/${r.id}`}
                className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Otevřít
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}