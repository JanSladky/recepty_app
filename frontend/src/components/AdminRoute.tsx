"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAdmin from "@/hooks/useAdmin";

/**
 * AdminRoute – ochrana stránek.
 * - default: pustí ADMIN i SUPERADMIN
 * - když předáš requireSuperadmin, pustí jen SUPERADMIN
 */
export default function AdminRoute({
  children,
  requireSuperadmin = false,
}: {
  children: React.ReactNode;
  requireSuperadmin?: boolean;
}) {
  const { isAdmin, isSuperadmin, loading } = useAdmin();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }

    if (requireSuperadmin) {
      if (isSuperadmin === false) router.replace("/");
      return;
    }

    // default: admin OR superadmin
    if (isAdmin === false) router.replace("/");
  }, [loading, isAdmin, isSuperadmin, requireSuperadmin, router]);

  if (loading || isAdmin === null || isSuperadmin === null) {
    return <p className="p-10 text-center">Ověřuji oprávnění…</p>;
  }

  return <>{children}</>;
}