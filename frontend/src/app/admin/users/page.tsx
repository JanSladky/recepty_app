"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import AdminRoute from "@/components/AdminRoute";

type Role = "SUPERADMIN" | "ADMIN" | "USER";

type User = {
  id: number;
  name: string | null;
  email: string;
  role: Role;
  avatar_url?: string | null;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

/** Type guard pro Axios-like error (funguje i bez axios.isAxiosError) */
function isAxiosErrorLike(e: unknown): e is {
  isAxiosError: boolean;
  message: string;
  response?: { data?: unknown };
} {
  return typeof e === "object" && e !== null && "isAxiosError" in e;
}

/** Sjednocené čtení chybové hlášky */
function getAxiosErrorMessage(error: unknown): string {
  if (isAxiosErrorLike(error)) {
    const data = (error.response?.data ?? {}) as { error?: string; message?: string };
    return data.error || data.message || error.message || "Došlo k chybě při komunikaci se serverem.";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Neočekávaná chyba.";
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const authHeaders = useCallback(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get<User[]>(`${API_URL}/api/admin/users`, {
        headers: authHeaders(),
      });
      setUsers(data);
      setError(null);
    } catch (error: unknown) {
      setError(getAxiosErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  const changeRole = useCallback(
    async (id: number, role: Role) => {
      try {
        setSavingId(id);
        await axios.patch(
          `${API_URL}/api/admin/users/${id}/role`,
          { role },
          { headers: { ...authHeaders(), "Content-Type": "application/json" } }
        );
        await fetchUsers();
      } catch (error: unknown) {
        alert(getAxiosErrorMessage(error) || "Změna role selhala.");
      } finally {
        setSavingId(null);
      }
    },
    [authHeaders, fetchUsers]
  );

  const deleteUser = useCallback(
    async (id: number) => {
      if (!confirm("Opravdu smazat tohoto uživatele?")) return;
      try {
        setSavingId(id);
        await axios.delete(`${API_URL}/api/admin/users/${id}`, {
          headers: authHeaders(),
        });
        await fetchUsers();
      } catch (error: unknown) {
        alert(getAxiosErrorMessage(error) || "Smazání selhalo.");
      } finally {
        setSavingId(null);
      }
    },
    [authHeaders, fetchUsers]
  );

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  if (loading) {
    return <div className="p-6">Načítám uživatele…</div>;
  }

  return (
    <AdminRoute requireSuperadmin>
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Správa uživatelů</h1>

        {error && (
          <div className="mb-4 rounded border px-3 py-2 text-sm text-red-700 border-red-300 bg-red-50">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="py-2 pr-2">ID</th>
                <th className="py-2 pr-2">Jméno</th>
                <th className="py-2 pr-2">Email</th>
                <th className="py-2 pr-2">Role</th>
                <th className="py-2 pr-2">Akce</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b">
                  <td className="py-2 pr-2">{u.id}</td>
                  <td className="py-2 pr-2">{u.name ?? "-"}</td>
                  <td className="py-2 pr-2">{u.email}</td>
                  <td className="py-2 pr-2">
                    <select
                      className="border rounded px-2 py-1"
                      value={u.role}
                      onChange={(e) => changeRole(u.id, e.target.value as Role)}
                      disabled={savingId === u.id}
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="SUPERADMIN">SUPERADMIN</option>
                    </select>
                  </td>
                  <td className="py-2 pr-2">
                    <button
                      className="underline text-red-600 disabled:opacity-50"
                      onClick={() => deleteUser(u.id)}
                      disabled={savingId === u.id || u.role === "SUPERADMIN"}
                    >
                      Smazat
                    </button>
                  </td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-sm text-gray-500">
                    Žádní uživatelé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminRoute>
  );
}