import { createContext, useContext, useState, ReactNode } from "react";

// tipe user — disesuaikan sama response backend kita nanti
// field token optional karena demo mode ga perlu JWT
export interface AuthUser {
  email: string;
  name: string;
  role: "peserta" | "fasilitator";
  id: string;
  token?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

// akun demo buat testing UI — password sengaja simpel
// jangan dipake di production ya wkwk
// TODO: hapus ini setelah BE auth beneran jadi
const DEMO_USERS: Record<string, { password: string; user: AuthUser }> = {
  "peserta@codingcamp.id": {
    password: "copilot2026",
    user: {
      email: "peserta@codingcamp.id",
      name: "Peserta Demo",
      role: "peserta",
      id: "USR-001",
    },
  },
  "fasilitator@codingcamp.id": {
    password: "fasil2026",
    user: {
      email: "fasilitator@codingcamp.id",
      name: "Fasilitator Demo",
      role: "fasilitator",
      id: "FAC-001",
    },
  },
};

// key storage — harus konsisten di semua file
const STORAGE_KEY = "cc_user";

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

// null sebagai default value — dicek di useAuth()
const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // inisialisasi dari persisted session kalau ada
  const [user, setUser] = useState<AuthUser | null>(loadSession);

  const login = async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    // coba ke backend JWT dulu
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        signal: AbortSignal.timeout(5000),
      });

      if (res.ok) {
        const data = await res.json();
        // expected format: { token: "...", user: { email, name, role, id } }
        const authUser: AuthUser = { ...data.user, token: data.token };
        setUser(authUser);
        saveSession(authUser, true);
        return { ok: true };
      }

      if (res.status === 401) {
        return { ok: false, error: "Email atau password salah." };
      }

      // status lain (500, dll) — lempar ke catch buat fallback ke demo
      throw new Error("server error " + res.status);
    } catch {
      // backend belum up atau network error
      // ini normal waktu FE dan BE dikembangkan paralel
      // console.log("backend belum ready, coba demo user"); // debug
    }

    // fallback ke demo user
    await new Promise(r => setTimeout(r, 900)); // simulate delay biar ga instant banget
    const record = DEMO_USERS[email.toLowerCase()];
    if (record && record.password === password) {
      setUser(record.user);
      saveSession(record.user, false); // demo pakai sessionStorage
      return { ok: true };
    }

    return {
      ok: false,
      error: "Email atau password salah. Gunakan kredensial demo di bawah.",
    };
  };

  const logout = () => {
    setUser(null);
    clearSession();
    // navigasi ke /login dilakukan di komponen yang panggil logout
    // bukan di sini supaya ga ada coupling ke router
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, login, logout }}>
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
