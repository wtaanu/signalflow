import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

interface User {
  id: number;
  email: string;
  name: string | null;
  picture: string | null;
  plan: string;
  plan_expires_at: string | null;
  monthly_usage: number;
  usage_reset_at: string | null;
}

interface AuthContextType {
  user: User | null;
  sessionToken: string | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_BASE = "/api";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(() => localStorage.getItem("sf_session"));
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async (token: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { "x-session-token": token },
      });
      if (!res.ok) {
        localStorage.removeItem("sf_session");
        setSessionToken(null);
        setUser(null);
        return;
      }
      const data = await res.json();
      setUser(data);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlSession = params.get("session");
    const urlError = params.get("error");
    if (urlSession) {
      localStorage.setItem("sf_session", urlSession);
      setSessionToken(urlSession);
      window.history.replaceState({}, "", window.location.pathname);
    } else if (urlError) {
      // Auth failed — stash error in sessionStorage so login page can show it
      localStorage.removeItem("sf_session");
      sessionStorage.setItem("sf_auth_error", urlError);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (sessionToken) {
      fetchMe(sessionToken).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [sessionToken, fetchMe]);

  const login = async (token: string) => {
    localStorage.setItem("sf_session", token);
    setSessionToken(token);
    await fetchMe(token);
  };

  const logout = () => {
    if (sessionToken) {
      fetch(`${API_BASE}/auth/logout`, { method: "POST", headers: { "x-session-token": sessionToken } }).catch(() => {});
    }
    localStorage.removeItem("sf_session");
    setSessionToken(null);
    setUser(null);
  };

  const refresh = async () => {
    if (sessionToken) await fetchMe(sessionToken);
  };

  return (
    <AuthContext.Provider value={{ user, sessionToken, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export const API_BASE_URL = API_BASE;
