"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  isLoggedIn: boolean;
  userEmail: string | null;
  userAvatar: string | null;
  login: (email: string, avatar: string) => void;
  logout: () => void;
  ready: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    const avatar = localStorage.getItem("userAvatar");
    setUserEmail(email);
    setUserAvatar(avatar);
    setReady(true);

    const syncAuth = () => {
      setUserEmail(localStorage.getItem("userEmail"));
      setUserAvatar(localStorage.getItem("userAvatar"));
    };

    window.addEventListener("storage", syncAuth);
    return () => window.removeEventListener("storage", syncAuth);
  }, []);

  const login = (email: string, avatar: string) => {
    localStorage.setItem("userEmail", email);
    localStorage.setItem("userAvatar", avatar);
    setUserEmail(email);
    setUserAvatar(avatar);
  };

  const logout = () => {
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userAvatar");
    localStorage.removeItem("isAdmin");
    setUserEmail(null);
    setUserAvatar(null);
  };

  return <AuthContext.Provider value={{ isLoggedIn: !!userEmail, userEmail, userAvatar, login, logout, ready }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth musí být použit uvnitř <AuthProvider>");
  }
  return context;
}
