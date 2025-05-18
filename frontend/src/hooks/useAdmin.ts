import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    if (!email) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    fetch(`${API_URL}/api/users/${encodeURIComponent(email)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setIsAdmin(data?.is_admin === true);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Chyba při načítání admina:", err);
        setIsAdmin(false);
        setLoading(false);
      });
  }, []);

  return { isAdmin, loading };
}