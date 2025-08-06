"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  isLoggedIn: boolean;
  userEmail: string | null;
  login: (email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const syncAuth = () => {
      const email = localStorage.getItem("userEmail");
      setUserEmail(email);
    };

    syncAuth(); // inicializace při mountu

    window.addEventListener("storage", syncAuth); // reaguje na změny z jiných částí aplikace

    return () => window.removeEventListener("storage", syncAuth);
  }, []);

  const login = (email: string) => {
    localStorage.setItem("userEmail", email);
    setUserEmail(email);
  };

  const logout = () => {
    localStorage.removeItem("userEmail");
    localStorage.removeItem("isAdmin");
    setUserEmail(null);
  };

  return <AuthContext.Provider value={{ isLoggedIn: !!userEmail, userEmail, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth musí být použit uvnitř <AuthProvider>");
  }
  return context;
}
