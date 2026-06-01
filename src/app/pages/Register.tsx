import React, { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router";
import { Bot, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, User} from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext";

// URL backend — harus konsisten dengan AuthContext.tsx dan Chat.tsx
// sebelumnya salah: pakai port 5001 dan path /api/v1 yang berbeda dari endpoint lain
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export function Register() {
  const { isLoggedIn, login } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (isLoggedIn) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const name = fullName.trim();
    if (!name || !email || !password) {
      setError("Semua field wajib diisi.");
      return;
    }
    if (name.length < 2) {
      setError("Nama minimal 2 karakter.");
      return;
    }
    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setError("Password harus mengandung huruf dan angka.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, full_name: name }),
        signal: AbortSignal.timeout(8000),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 409) {
          setError("Email sudah terdaftar. Silakan login atau gunakan email lain.");
        } else if (res.status === 429) {
          setError("Terlalu banyak percobaan. Coba lagi sebentar.");
        } else if (data?.error?.details?.length) {
          setError(data.error.details[0].issue);
        } else {
          setError(data?.error?.message ?? "Pendaftaran gagal.");
        }
        setLoading(false);
        return;
      }

      const loginResult = await login(email, password);
      setLoading(false);
      if (loginResult.ok) {
        navigate("/", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    } catch {
      setLoading(false);
      setError("Server tidak dapat dijangkau. Coba lagi nanti.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#E31E24]/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#5B1A8A]/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Welcome header - lebih engaging dari Login */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-5">
            <div className="w-18 h-18 w-[72px] h-[72px] bg-gradient-to-br from-[#E31E24] via-[#CC0000] to-[#5B1A8A] rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-red-900/50">
              <Bot className="w-9 h-9 text-white" />
            </div>
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#0D0D0D] flex items-center justify-center"
            >
              <span className="text-[8px] text-white font-bold">+</span>
            </motion.div>
          </div>
          <h1 className="text-white text-2xl font-bold">Bergabung Sekarang!</h1>
          <p className="text-slate-400 text-sm mt-1.5 max-w-xs mx-auto leading-relaxed">
            Buat akun untuk mengakses Copilot AI Coding Camp 2026
          </p>
          {/* Steps mini indicator */}
          <div className="flex items-center justify-center gap-3 mt-4">
            {["Daftar", "Login", "Tanya AI"].map((step, i) => (
              <div key={step} className="flex items-center gap-1.5">
                <div className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${i === 0 ? "bg-[#CC0000] text-white" : "bg-white/8 text-slate-500"}`}>
                  {i + 1}
                </div>
                <span className={`text-xs ${i === 0 ? "text-white font-medium" : "text-slate-600"}`}>{step}</span>
                {i < 2 && <span className="text-slate-700 text-xs">›</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#130B1E] border border-red-900/20 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-white text-base font-semibold mb-5 text-center">Isi data kamu</h2>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 bg-red-950/60 border border-red-700/40 rounded-xl px-4 py-3 mb-5"
            >
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-sm">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nama lengkap kamu"
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-[#E31E24]/60 focus:ring-2 focus:ring-[#E31E24]/15 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@codingcamp.id"
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-[#E31E24]/60 focus:ring-2 focus:ring-[#E31E24]/15 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 karakter, ada huruf & angka"
                  className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-[#E31E24]/60 focus:ring-2 focus:ring-[#E31E24]/15 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Password strength bar */}
              {password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1,2,3,4].map(level => {
                      const strength = password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password) ? 4
                        : password.length >= 10 && /[A-Za-z]/.test(password) && /[0-9]/.test(password) ? 3
                        : password.length >= 8 && (/[A-Za-z]/.test(password) || /[0-9]/.test(password)) ? 2
                        : 1;
                      return (
                        <div key={level} className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          level <= strength
                            ? strength === 1 ? "bg-red-500" : strength === 2 ? "bg-amber-400" : strength === 3 ? "bg-emerald-400" : "bg-emerald-500"
                            : "bg-white/8"
                        }`} />
                      );
                    })}
                  </div>
                  <p className={`text-[11px] ${
                    (/[A-Za-z]/.test(password) && /[0-9]/.test(password) && password.length >= 8) ? "text-emerald-400" : "text-slate-500"
                  }`}>
                    {password.length < 8 ? "Terlalu pendek" : !/[A-Za-z]/.test(password) || !/[0-9]/.test(password) ? "Tambahkan huruf dan angka" : password.length >= 12 ? "Password kuat 💪" : "Password cukup baik"}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                Konfirmasi Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password"
                  className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-[#E31E24]/60 focus:ring-2 focus:ring-[#E31E24]/15 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#E31E24] hover:bg-[#A51419] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg shadow-red-900/40 mt-2"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Mendaftarkan...</>
                : "Daftar"
              }
            </button>
          </form>

          <p className="mt-6 text-center text-slate-400 text-sm">
            Sudah punya Akun?{" "}
            <Link to="/login" className="text-[#E31E24] hover:text-[#FF4444] font-semibold transition-colors">
              Masuk di sini
            </Link>
          </p>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          Coding Camp 2026 × <span className="text-[#E31E24]">DBS Foundation</span> · Road to Future Workforce
        </p>
      </motion.div>
    </div>
  );
}
