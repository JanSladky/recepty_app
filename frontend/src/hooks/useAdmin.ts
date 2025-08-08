import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Role = "SUPERADMIN" | "ADMIN" | "USER";

export default function useAdmin() {
  const [role, setRole] = useState<Role | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isSuperadmin, setIsSuperadmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const email = typeof window !== "undefined" ? localStorage.getItem("userEmail") : null;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!email || !token) {
      setRole(null);
      setIsAdmin(false);
      setIsSuperadmin(false);
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/user/email?email=${encodeURIComponent(email)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!res.ok) {
          setRole(null);
          setIsAdmin(false);
          setIsSuperadmin(false);
          return;
        }

        const user = await res.json();
        const r = (user.role || "USER") as Role;

        setRole(r);
        setIsAdmin(r === "ADMIN" || r === "SUPERADMIN");
        setIsSuperadmin(r === "SUPERADMIN");
      } catch {
        setRole(null);
        setIsAdmin(false);
        setIsSuperadmin(false);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { role, isAdmin, isSuperadmin, loading };
}