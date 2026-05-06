import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  Bot, Menu, X, MessageSquare, Home, LogIn,
  BookOpen, LogOut, ChevronDown, Clock, User,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

// daftar link navigasi — tambahin di sini kalau ada halaman baru
// urutan ini juga yang muncul di mobile menu
const navLinks = [
  { to: "/",        label: "Beranda", icon: Home          },
  { to: "/chat",    label: "Chat AI", icon: MessageSquare },
  { to: "/faq",     label: "FAQ",     icon: BookOpen      },
  { to: "/history", label: "Riwayat", icon: Clock         },
];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate("/login");
  };

  // badge role — warna beda antara fasilitator dan peserta
  const rolePill = user?.role === "fasilitator"
    ? "bg-red-900/40 border-red-400/40 text-red-300"
    : "bg-violet-900/40 border-violet-400/40 text-violet-300";

  return (
    <nav className="sticky top-0 z-50 bg-[#0D0D0D]/95 backdrop-blur-md border-b border-red-900/30 shadow-lg shadow-black/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-gradient-to-br from-[#E31E24] to-[#5B1A8A] rounded-xl flex items-center justify-center shadow-lg shadow-red-900/50 group-hover:shadow-red-600/40 transition-shadow">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-white font-bold text-sm tracking-tight">Coding Camp</span>
              <span className="text-[#E31E24] font-bold text-sm tracking-tight">Copilot</span>
            </div>
          </Link>

          {/* Nav links — desktop */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => {
              const isActive = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-all ${
                    isActive
                      ? "bg-red-950/60 text-[#E31E24] font-semibold border border-red-800/40"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Kanan: user dropdown atau tombol login */}
          <div className="flex items-center gap-2">
            {isLoggedIn && user ? (
              <>
                {/* User dropdown — desktop only */}
                <div className="hidden sm:block relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
                  >
                    <div className="w-6 h-6 bg-gradient-to-br from-[#E31E24] to-[#5B1A8A] rounded-lg flex items-center justify-center text-white text-[10px] font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <div className="flex flex-col items-start leading-none">
                      {/* hanya nama depan biar ga terlalu panjang */}
                      <span className="text-white text-xs font-semibold">
                        {user.name.split(" ")[0]}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium capitalize mt-0.5 ${rolePill}`}>
                        {user.role}
                      </span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                  </button>

                  {/* Dropdown menu */}
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-[#130B1E] border border-red-900/30 rounded-xl shadow-2xl overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-white/5">
                        <p className="text-white text-sm font-semibold">{user.name}</p>
                        <p className="text-slate-400 text-xs mt-0.5">{user.email}</p>
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-slate-300 hover:bg-white/5 transition-colors text-sm"
                      >
                        <User className="w-4 h-4" /> Profil & Pengaturan
                      </Link>
                      <Link
                        to="/history"
                        onClick={() => setUserMenuOpen(false)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-slate-300 hover:bg-white/5 transition-colors text-sm"
                      >
                        <Clock className="w-4 h-4" /> Riwayat Chat
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-red-400 hover:bg-red-950/40 transition-colors text-sm border-t border-white/5"
                      >
                        <LogOut className="w-4 h-4" /> Keluar
                      </button>
                    </div>
                  )}
                </div>

                {/* Tombol chat shortcut */}
                <Link
                  to="/chat"
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#E31E24] hover:bg-[#A51419] text-white text-sm rounded-xl transition-all font-semibold shadow-lg shadow-red-900/40"
                >
                  <MessageSquare className="w-4 h-4" /> Chat
                </Link>
              </>
            ) : (
              <>
                {/* Belum login */}
                <Link
                  to="/login"
                  className="hidden sm:flex items-center gap-2 px-4 py-2 border border-white/15 text-slate-300 text-sm rounded-xl hover:bg-white/5 transition-all font-medium"
                >
                  <LogIn className="w-4 h-4" /> Masuk
                </Link>
                <Link
                  to="/chat"
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#E31E24] hover:bg-[#A51419] text-white text-sm rounded-xl transition-all font-semibold shadow-lg shadow-red-900/40"
                >
                  <MessageSquare className="w-4 h-4" /> Mulai Chat
                </Link>
              </>
            )}

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:bg-white/10 transition-colors"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 border-t border-white/5 mt-2 pt-3">
            <div className="flex flex-col gap-1">
              {navLinks.map(({ to, label, icon: Icon }) => {
                const isActive = location.pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-all ${
                      isActive
                        ? "bg-red-950/60 text-[#E31E24] font-semibold"
                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4" />{label}
                  </Link>
                );
              })}

              {isLoggedIn && user ? (
                <>
                  <div className="mx-4 my-2 h-px bg-white/5" />
                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-white/5 hover:text-white transition-all"
                  >
                    <User className="w-4 h-4" /> Profil
                  </Link>
                  {/* info user di mobile */}
                  <div className="px-4 py-2 flex items-center gap-2">
                    <div className="w-7 h-7 bg-gradient-to-br from-[#E31E24] to-[#5B1A8A] rounded-lg flex items-center justify-center text-white text-xs font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{user.name}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium capitalize ${rolePill}`}>
                        {user.role}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => { handleLogout(); setMenuOpen(false); }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-950/40 transition-all"
                  >
                    <LogOut className="w-4 h-4" /> Keluar
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-white/5 hover:text-white transition-all"
                >
                  <LogIn className="w-4 h-4" /> Masuk
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* overlay transparan — klik di luar untuk tutup dropdown */}
      {userMenuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
      )}
    </nav>
  );
}
