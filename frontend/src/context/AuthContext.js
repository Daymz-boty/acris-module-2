// ============================================================================
// AuthContext.js — ACRIS · Authentication State
// ============================================================================
import { createContext, useContext, useState, useCallback, useEffect } from "react";

const AuthContext = createContext(null);

// Decode JWT payload without crypto (just read the base64 middle segment)
function decodeJwtPayload(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad     = base64.length % 4 ? "=".repeat(4 - (base64.length % 4)) : "";
    return JSON.parse(atob(base64 + pad));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user,  setUser]  = useState(null);
  const [token, setToken] = useState(null);
  const [ready, setReady] = useState(false); // true once localStorage has been read

  // Hydrate from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("acris_token");
    const storedUser  = localStorage.getItem("acris_user");
    if (storedToken && storedUser) {
      const payload = decodeJwtPayload(storedToken);
      // Only restore if token is still valid
      if (payload && payload.exp * 1000 > Date.now()) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } else {
        // Expired — clear storage silently
        localStorage.removeItem("acris_token");
        localStorage.removeItem("acris_user");
      }
    }
    setReady(true);
  }, []);

  const login = useCallback((newToken, newUser) => {
    localStorage.setItem("acris_token", newToken);
    localStorage.setItem("acris_user",  JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("acris_token");
    localStorage.removeItem("acris_user");
    setToken(null);
    setUser(null);
  }, []);

  const isAuthenticated = useCallback(() => {
    if (!token) return false;
    const payload = decodeJwtPayload(token);
    return payload ? payload.exp * 1000 > Date.now() : false;
  }, [token]);

  // Attach Authorization header to every fetch automatically
  const authFetch = useCallback(async (url, options = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  
  const res = await fetch(url, { ...options, headers });
  
  // 401 means token was rejected server-side — log out
  if (res.status === 401) {
    logout();
    throw new Error('Authentication failed - please log in again');
  }
  
  return res;
}, [token, logout]);

  return (
    <AuthContext.Provider value={{ user, token, ready, login, logout, isAuthenticated, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
