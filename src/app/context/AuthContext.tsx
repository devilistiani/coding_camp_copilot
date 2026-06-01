import { createContext, useContext, useState, ReactNode } from "react";
// Struktur data user yang tersimpan setelah berhasil login.
// Harus sinkron dengan response dari backend Express.js kita.
// field token bersifat optional karena mode demo tidak memakai JWT.
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
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
}
// URL backend diambil dari .env — pastikan VITE_API_URL sudah diset sebelum build production
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

// Password sengaja sederhana karena hanya digunakan di lingkungan development.
// Hapus atau nonaktifkan blok ini setelah implementasi auth JWT di backend selesai.
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
  "admin@codingcamp.id": {
    password: "admin2026",
    user: {
      email: "admin@codingcamp.id",
      name: "Admin Demo",
      role: "admin",
      id: "ADM-001",
    },
  },
};

// Key storage harus konsisten di semua file yang mengakses session user.
// Mengubah nilai ini akan membuat semua sesi yang tersimpan tidak terbaca.
const STORAGE_KEY = "cc_user";

function saveSession(user: AuthUser, remember: boolean) {
  const data = JSON.stringify(user);
  // remember = true → localStorage (bertahan walau browser ditutup)
  // remember = false → sessionStorage (hilang saat tab ditutup)
  if (remember) {
    localStorage.setItem(STORAGE_KEY, data);
  } else {
    sessionStorage.setItem(STORAGE_KEY, data);
  }
}

// Periksa localStorage terlebih dahulu, lalu sessionStorage sebagai fallback.
// Mengembalikan null jika belum pernah login atau data tersimpan corrupt
function loadSession(): AuthUser | null {
  try {
    const local = localStorage.getItem(STORAGE_KEY);
    const session = sessionStorage.getItem(STORAGE_KEY);
    const raw = local ?? session;
    return raw ? JSON.parse(raw) : null;
  } catch {
    // Data JSON corrupt — anggap belum login daripada crash
    return null;
  }
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
}
// null sebagai default value — useAuth() akan melempar error jika dipakai di luar AuthProvider
const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Inisialisasi langsung dari sesi yang tersimpan agar user tidak perlu login ulang setelah refresh
  const [user, setUser] = useState<AuthUser | null>(loadSession);

  const login = async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    // Langkah 1: Autentikasi ke backend JWT
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

      // status lain (500, 503, dll) — lempar ke catch buat fallback ke demo user
      throw new Error("server error " + res.status);
    } catch {
      // Backend belum berjalan atau ada masalah jaringan
      // Kondisi ini normal saat FE dan BE dikembangkan secara paralel
    }

    // fallback ke demo user (hanya aktif saat backend tidak tersedia)
    // simulate delay biar ga instant banget
    await new Promise<void>(r => setTimeout(r, 900));
    const record = DEMO_USERS[email.toLowerCase()];
    if (record && record.password === password) {
      setUser(record.user);
      //  Demo memakai sessionStorage agar sesi hilang saat tab ditutup
      saveSession(record.user, false);
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
    // bukan di sini, agar AuthContext tidak memiliki ketergantungan ke router
  };

  const updateUser = (updates: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updates };
      const inLocal = localStorage.getItem(STORAGE_KEY) !== null;
      saveSession(next, inLocal);
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook — lebih bersih daripada memanggil useContext(AuthContext) langsung di setiap komponen
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus digunakan di dalam AuthProvider");
  return ctx;
}
