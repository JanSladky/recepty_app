import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    console.log("📧 email:", email);
    console.log("🌍 API_URL:", API_URL);

    if (!email) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_URL}/api/user/email?email=${encodeURIComponent(email)}`);
        
        if (!res.ok) {
          console.warn("❌ Uživatel nenalezen nebo chyba v odpovědi:", res.status);
          setIsAdmin(false);
          return;
        }

        const user = await res.json();
        console.log("📦 Načtený uživatel:", user);
        console.log("✅ user.is_admin:", user.is_admin);
        console.log("✅ Nastavuji isAdmin na:", user.is_admin === true);

        setIsAdmin(user.is_admin === true);
      } catch (err) {
        console.error("❌ Chyba při ověřování admina:", err);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { isAdmin, loading };
}