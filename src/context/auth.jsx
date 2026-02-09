"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  const fetchUser = useCallback(async () => {
    try {
      const res = await api.get("/auth/me");
      setUser(res);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await api.post("/auth/logout");
    setUser(null);
    initialized.current = false;
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    fetchUser();
  }, [fetchUser]);

  const setUserAndReady = useCallback((userData) => {
    setUser(userData);
    setLoading(false);
    initialized.current = true;
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser: setUserAndReady, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
