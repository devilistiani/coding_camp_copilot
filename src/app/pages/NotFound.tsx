import { Link } from "react-router";
import { Bot, Home, MessageSquare, BookOpen } from "lucide-react";
import { motion } from "motion/react";

export function NotFound() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#E31E24]/6 rounded-full blur-3xl pointer-events-none" />
      <div className="text-center max-w-md relative">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
          <div className="w-20 h-20 bg-gradient-to-br from-[#E31E24] to-[#5B1A8A] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-red-900/50">
            <Bot className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-white text-6xl font-bold mb-2">404</h1>
          <p className="text-[#E31E24] font-semibold mb-2">Halaman Tidak Ditemukan</p>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            Copilot tidak menemukan halaman yang kamu cari. Mungkin URL salah atau halaman sudah dipindah.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E31E24] hover:bg-[#A51419] text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-red-900/40">
              <Home className="w-4 h-4" /> Ke Beranda
            </Link>
            <Link to="/chat" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/15 text-white rounded-xl font-semibold text-sm hover:bg-white/10 transition-all">
              <MessageSquare className="w-4 h-4" /> Tanya Copilot
            </Link>
            <Link to="/faq" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/15 text-white rounded-xl font-semibold text-sm hover:bg-white/10 transition-all">
              <BookOpen className="w-4 h-4" /> FAQ
            </Link>
          </div>
          <p className="text-slate-600 text-xs mt-8">CC26-PSU096 · Coding Camp Copilot × DBS Foundation 2026</p>
        </motion.div>
      </div>
    </div>
  );
}
