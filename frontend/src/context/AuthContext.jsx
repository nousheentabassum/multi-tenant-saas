import { createContext, useContext, useState, useEffect } from "react";
import { users } from "../api/client";

const AuthContext = createContext(null);

/** Ensure role is always uppercase so role checks work (backend uses ADMIN/MANAGER/MEMBER). */
function normalizeUser(u) {
  if (!u) return u;
  const role = (u.role ?? u.Role ?? "").toString().toUpperCase();
  return { ...u, role: role || u.role };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    users
      .me()
      .then((data) => setUser(normalizeUser(data.user)))
      .catch(() => {
        localStorage.removeItem("token");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = (token, userData) => {
    localStorage.setItem("token", token);
    setUser(normalizeUser(userData));
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
