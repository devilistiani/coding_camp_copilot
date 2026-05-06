import { Bot, Github, Heart, MessageSquare, BookOpen, Home } from "lucide-react";
import { Link } from "react-router";

export function Footer() {
  return (
    <footer className="bg-[#0D0D0D] border-t border-red-900/20 text-slate-400 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-[#E31E24] to-[#5B1A8A] rounded-lg flex items-center justify-center shadow-lg shadow-red-900/40">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-white font-bold text-sm">Coding Camp Copilot</span>
                <p className="text-slate-500 text-[10px]">Accessible & Adaptive Learning</p>
              </div>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Sistem AI terpadu untuk peserta Coding Camp 2026 — mengklasifikasikan pertanyaan,
              menentukan urgensi, dan memberikan draft reply otomatis untuk fasilitator.
            </p>
            <p className="text-slate-600 text-xs mt-3 font-mono">ID Tim: CC26-PSU096</p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">Navigasi</h4>
            <ul className="space-y-2 text-sm">
              {[
                { to: "/",     icon: Home,          label: "Beranda"      },
                { to: "/chat", icon: MessageSquare, label: "Chat AI"      },
                { to: "/faq",  icon: BookOpen,      label: "FAQ & Panduan"},
              ].map(({ to, icon: Icon, label }) => (
                <li key={to}>
                  <Link to={to} className="flex items-center gap-2 text-slate-500 hover:text-[#E31E24] transition-colors">
                    <Icon className="w-3.5 h-3.5" />{label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">Info Proyek</h4>
            <ul className="space-y-1.5 text-sm text-slate-500">
              <li>🎯 Tema: <span className="text-slate-300">Accessible & Adaptive Learning</span></li>
              <li>🏆 <span className="text-slate-300">Coding Camp 2026</span></li>
              <li>🤝 Powered by <span className="text-[#E31E24] font-semibold">DBS Foundation</span></li>
              <li className="pt-1">
                <span className="text-[10px] bg-red-950/40 border border-red-800/30 text-red-400 px-2 py-1 rounded-full">
                  NLP · TensorFlow · RAG · PostgreSQL
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-600 flex items-center gap-1">
            Dibuat oleh{" "}
            <span className="text-slate-500">Tim CC26-PSU096 · 6 Anggota · 3 Learning Path</span>
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-slate-600 hover:text-[#E31E24] transition-colors">
              <Github className="w-4 h-4" />
            </a>
            <span className="text-xs text-slate-600">© 2026 Coding Camp Copilot × DBS Foundation</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
