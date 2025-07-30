"use client";

import { useEffect, useState } from "react";
import axios from "axios";

type User = {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
};

export default function AdminUserPage() {
  const [users, setUsers] = useState<User[]>([]);

  const fetchUsers = async () => {
    const token = localStorage.getItem("token");
    const { data } = await axios.get<User[]>("/api/admin/users", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setUsers(data);
  };

  const toggleRole = async (id: number, current: boolean) => {
    const token = localStorage.getItem("token");
    await axios.put(
      `/api/admin/users/${id}/role`,
      { is_admin: !current },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    fetchUsers();
  };

  const deleteUser = async (id: number) => {
    const token = localStorage.getItem("token");
    await axios.delete(`/api/admin/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchUsers();
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Správa uživatelů</h2>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b">
            <th>Jméno</th>
            <th>Email</th>
            <th>Role</th>
            <th>Akce</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u: User) => (
            <tr key={u.id} className="border-b">
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.is_admin ? "Admin" : "Uživatel"}</td>
              <td>
                <button onClick={() => toggleRole(u.id, u.is_admin)} className="mr-2 underline text-blue-600">
                  Změnit roli
                </button>
                <button onClick={() => deleteUser(u.id)} className="underline text-red-600">
                  Smazat
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
