import { createContext, useCallback, useContext, useRef, useState, ReactNode } from "react";

// tipe user — disesuaikan sama response backend Express kita
// field token optional karena demo mode ga perlu JWT
export interface AuthUser {
  email: string;
  name: string;
  role: "peserta" | "admin";
  id: string;
  token?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoggedIn: boolean;
  sessionExpiredAt: number | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<AuthUser>) => void;
  refreshUser: () => Promise<void>;
  authFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  clearSessionExpired: () => void;
}

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5001/api/v1";

// key storage — harus konsisten di semua file
const STORAGE_KEY = "cc_user";
const REFRESH_KEY = "cc_refresh_token";
const SESSION_EXPIRED_KEY = "cc_session_expired";

function saveSession(user: AuthUser, remember: boolean) {
  const data = JSON.stringify(user);
  // kalau remember = true pakai localStorage (persist),
  // kalau false pakai sessionStorage (ilang waktu tab ditutup)
  if (remember) {
    localStorage.setItem(STORAGE_KEY, data);
  } else {
    sessionStorage.setItem(STORAGE_KEY, data);
  }
}

// cek localStorage dulu, baru sessionStorage
function loadSession(): AuthUser | null {
  try {
    const local = localStorage.getItem(STORAGE_KEY);
    const session = sessionStorage.getItem(STORAGE_KEY);
    const raw = local ?? session;
    return raw ? JSON.parse(raw) : null;
  } catch {
    // JSON corrupt — anggap belum login
    return null;
  }
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
}

function saveRefreshToken(rt: string, remember: boolean) {
  if (remember) localStorage.setItem(REFRESH_KEY, rt);
  else sessionStorage.setItem(REFRESH_KEY, rt);
}

function loadRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY) ?? sessionStorage.getItem(REFRESH_KEY);
}

function clearRefreshToken() {
  localStorage.removeItem(REFRESH_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
}

function inLocalStore(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

// null sebagai default value — dicek di useAuth()
const AuthContext = createContext<AuthContextType | null>(null);

function loadSessionExpired(): number | null {
  const raw = sessionStorage.getItem(SESSION_EXPIRED_KEY);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // inisialisasi dari persisted session kalau ada
  const [user, setUser] = useState<AuthUser | null>(loadSession);
  const [sessionExpiredAt, setSessionExpiredAt] = useState<number | null>(loadSessionExpired);
  const tokenRef = useRef<string | undefined>(user?.token);
  tokenRef.current = user?.token;

  const triggerSessionExpired = useCallback(() => {
    const now = Date.now();
    sessionStorage.setItem(SESSION_EXPIRED_KEY, String(now));
    setSessionExpiredAt(now);
  }, []);

  const clearSessionExpired = useCallback(() => {
    sessionStorage.removeItem(SESSION_EXPIRED_KEY);
    setSessionExpiredAt(null);
  }, []);

  const login = async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        signal: AbortSignal.timeout(8000),
      });

      const json = await res.json().catch(() => null);

      if (res.ok) {
        const payload = json?.data ?? json;
        const authUser: AuthUser = { ...payload.user, token: payload.token };
        setUser(authUser);
        saveSession(authUser, true);
        tokenRef.current = authUser.token;
        if (payload.refresh_token) {
          saveRefreshToken(payload.refresh_token, true);
        }
        sessionStorage.removeItem(SESSION_EXPIRED_KEY);
        setSessionExpiredAt(null);
        return { ok: true };
      }

      if (res.status === 401) {
        return { ok: false, error: "Email atau password salah." };
      }
      if (res.status === 429) {
        return { ok: false, error: "Terlalu banyak percobaan. Coba lagi sebentar." };
      }
      return { ok: false, error: json?.error?.message ?? "Login gagal." };
    } catch {
      return { ok: false, error: "Server tidak dapat dijangkau. Coba lagi nanti." };
    }
  };

  const logout = async (): Promise<void> => {
    const rt = loadRefreshToken();
    if (rt) {
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: rt }),
          signal: AbortSignal.timeout(5000),
        });
      } catch {
        // network error pas logout — ga blok user, lanjut clear local aja
      }
    }
    setUser(null);
    clearSession();
    clearRefreshToken();
    tokenRef.current = undefined;
  };

  const updateUser = (updates: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updates };
      saveSession(next, inLocalStore());
      tokenRef.current = next.token;
      return next;
    });
  };

  const refreshTokenOnce = useCallback(async (): Promise<string | null> => {
    const rt = loadRefreshToken();
    if (!rt) return null;
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: rt }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return null;
      const json = await res.json().catch(() => null);
      const payload = json?.data ?? json;
      const newAccess = payload?.token as string | undefined;
      const newRefresh = payload?.refresh_token as string | undefined;
      if (!newAccess || !newRefresh) return null;

      saveRefreshToken(newRefresh, inLocalStore());
      tokenRef.current = newAccess;

      setUser((prev) => {
        if (!prev) return prev;
        const next = { ...prev, token: newAccess };
        saveSession(next, inLocalStore());
        return next;
      });

      return newAccess;
    } catch {
      return null;
    }
  }, []);

  const authFetch = useCallback(
    async (input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> => {
      const buildHeaders = (token: string | undefined): HeadersInit => ({
        ...init.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      });

      let res = await fetch(input, { ...init, headers: buildHeaders(tokenRef.current) });

      if (res.status === 401 && tokenRef.current) {
        const newToken = await refreshTokenOnce();
        if (newToken) {
          res = await fetch(input, { ...init, headers: buildHeaders(newToken) });
        } else {
          setUser(null);
          clearSession();
          clearRefreshToken();
          tokenRef.current = undefined;
          triggerSessionExpired();
        }
      }

      return res;
    },
    [refreshTokenOnce, triggerSessionExpired],
  );

  const refreshUser = useCallback(async (): Promise<void> => {
    if (!tokenRef.current) return;
    try {
      const res = await authFetch(`${API_BASE}/auth/me`, {
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return;
      const json = await res.json().catch(() => null);
      const fresh = json?.data?.user;
      if (!fresh) return;
      setUser((prev) => {
        if (!prev) return prev;
        const next: AuthUser = {
          ...prev,
          email: fresh.email,
          name: fresh.name,
          role: fresh.role,
          id: fresh.id,
        };
        saveSession(next, inLocalStore());
        return next;
      });
    } catch {
      // diam aja — bukan critical path
    }
  }, [authFetch]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        sessionExpiredAt,
        login,
        logout,
        updateUser,
        refreshUser,
        authFetch,
        clearSessionExpired,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// custom hook — lebih clean dari useContext(AuthContext) langsung
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
