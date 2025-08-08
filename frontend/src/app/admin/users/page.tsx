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

/** Malý badge pro role */
function RoleBadge({ role }: { role: Role }) {
  const map: Record<Role, string> = {
    USER: "bg-gray-100 text-gray-800",
    ADMIN: "bg-blue-100 text-blue-800",
    SUPERADMIN: "bg-purple-100 text-purple-800",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[role]}`}>
      {role}
    </span>
  );
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
    return (
      <AdminRoute requireSuperadmin>
        <div className="p-6 max-w-5xl mx-auto">Načítám uživatele…</div>
      </AdminRoute>
    );
  }

  return (
    <AdminRoute requireSuperadmin>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Správa uživatelů</h1>
          <p className="text-gray-500 mt-1">Změna rolí a mazání účtů (jen pro SUPERADMIN).</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border px-4 py-3 text-sm text-red-700 border-red-300 bg-red-50">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr className="border-b text-gray-600">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Uživatel</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Akce</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b last:border-b-0 hover:bg-gray-50/60">
                    <td className="py-3 px-4 align-middle text-gray-700">{u.id}</td>

                    <td className="py-3 px-4 align-middle">
                      <div className="flex items-center gap-3">
                        {u.avatar_url ? (
                          <img
                            src={u.avatar_url}
                            alt={u.name ?? u.email}
                            className="w-8 h-8 rounded-full object-cover border"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-sm font-bold">
                            {(u.name?.charAt(0) || u.email.charAt(0)).toUpperCase()}
                          </div>
                        )}
                        <div className="leading-tight">
                          <div className="font-medium text-gray-800">{u.name ?? "-"}</div>
                          <div className="text-xs text-gray-500">
                            <RoleBadge role={u.role} />
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 align-middle text-gray-700">{u.email}</td>

                    <td className="py-3 px-4 align-middle">
                      <select
                        className="border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                        value={u.role}
                        onChange={(e) => changeRole(u.id, e.target.value as Role)}
                        disabled={savingId === u.id}
                      >
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="SUPERADMIN">SUPERADMIN</option>
                      </select>
                    </td>

                    <td className="py-3 px-4 align-middle">
                      <button
                        className="text-sm font-semibold text-red-600 hover:text-red-700 hover:underline disabled:opacity-50"
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
                    <td colSpan={5} className="py-10 text-center text-sm text-gray-500">
                      Žádní uživatelé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminRoute>
  );
}