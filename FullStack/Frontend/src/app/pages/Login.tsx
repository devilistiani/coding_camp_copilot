import React, { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router";
import { Bot, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { SessionExpiredToast } from "../components/SessionExpiredToast";

export function Login() {
  const { isLoggedIn, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // kalau udah login langsung redirect, ga perlu lihat halaman login lagi
  if (isLoggedIn) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // validasi simpel dulu sebelum kirim request
    if (!email || !password) {
      setError("Email dan password wajib diisi.");
      return;
    }

    setLoading(true);
    setError("");

    const result = await login(email, password);
    setLoading(false);

    if (result.ok) {
      navigate("/", { replace: true });
    } else {
      setError(result.error ?? "Login gagal.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center px-4 relative overflow-hidden">
      <SessionExpiredToast />
      {/* decorative blobs — visual aja, pointer-events none */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#E31E24]/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#5B1A8A]/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#E31E24] to-[#5B1A8A] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-red-900/50">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-white text-2xl font-bold">Coding Camp Copilot</h1>
          <p className="text-slate-400 text-sm mt-1">CC26-PSU096 · DBS Foundation 2026</p>
        </div>

        {/* Form card */}
        <div className="bg-[#130B1E] border border-red-900/20 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-white text-lg font-semibold mb-6 text-center">Masuk ke Akun</h2>

          {/* Error alert */}
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
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
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
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
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
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#E31E24] hover:bg-[#A51419] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg shadow-red-900/40 mt-2"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Memverifikasi...</>
                : "Masuk"
              }
            </button>
          </form>

          <p className="mt-6 text-center text-slate-400 text-sm">
            Belum punya Akun?{" "}
            <Link to="/register" className="text-[#E31E24] hover:text-[#FF4444] font-semibold transition-colors">
              Daftar Sekarang
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
