import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Bot, Menu, X, MessageSquare, Home, LogIn,
  BookOpen, LogOut, ChevronDown, Clock, User, ShieldCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navLinks = [
  { to: "/",        label: "Beranda", icon: Home          },
  { to: "/chat",    label: "Chat AI", icon: MessageSquare },
  { to: "/faq",     label: "FAQ",     icon: BookOpen      },
  { to: "/history", label: "Riwayat", icon: Clock         },
];

export function Navbar() {
  const [menuOpen, setMenuOpen]       = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const location = useLocation();
  const navigate  = useNavigate();
  const { user, isLoggedIn, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate("/login");
  };

  const rolePill = user?.role === "admin"
    ? "bg-amber-500/15 border-amber-400/30 text-amber-300"
    : "bg-violet-500/15 border-violet-400/30 text-violet-300";

  return (
    <nav className="sticky top-0 z-50 bg-[#0D0D0D]/95 backdrop-blur-md border-b border-white/6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-[#E31E24] to-[#5B1A8A] rounded-lg flex items-center justify-center shadow-md shadow-red-900/40 group-hover:shadow-red-600/40 transition-shadow">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-sm tracking-tight">
              Coding Camp <span className="text-[#E31E24]">Copilot</span>
            </span>
          </Link>

          {/* Nav links — desktop */}
          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map(({ to, label, icon: Icon }) => {
              const isActive = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm transition-all font-medium ${
                    isActive
                      ? "text-white bg-white/8"
                      : "text-slate-500 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-indicator"
                      className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#E31E24] rounded-full"
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {isLoggedIn && user ? (
              <>
                {/* User dropdown */}
                <div className="hidden sm:block relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-white/8 bg-white/4 hover:bg-white/8 transition-all"
                  >
                    <div className="w-6 h-6 bg-gradient-to-br from-[#E31E24] to-[#5B1A8A] rounded-md flex items-center justify-center text-white text-[10px] font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white text-xs font-semibold">{user.name.split(" ")[0]}</span>
                    <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-52 bg-[#130B1E] border border-white/8 rounded-xl shadow-2xl shadow-black/60 overflow-hidden z-50"
                      >
                        <div className="px-4 py-3 border-b border-white/5">
                          <p className="text-white text-sm font-semibold truncate">{user.name}</p>
                          <p className="text-slate-500 text-xs mt-0.5 truncate">{user.email}</p>
                          <span className={`inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full border font-medium capitalize ${rolePill}`}>
                            {user.role}
                          </span>
                        </div>
                        <Link to="/profile" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-slate-300 hover:bg-white/5 hover:text-white transition-colors text-sm">
                          <User className="w-3.5 h-3.5" /> Edit Profil
                        </Link>
                        <Link to="/history" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-slate-300 hover:bg-white/5 hover:text-white transition-colors text-sm">
                          <Clock className="w-3.5 h-3.5" /> Riwayat Chat
                        </Link>
                        {user.role === "admin" && (
                          <Link to="/admin" onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-amber-300 hover:bg-amber-500/10 transition-colors text-sm border-t border-white/5">
                            <ShieldCheck className="w-3.5 h-3.5" /> Admin Panel
                          </Link>
                        )}
                        <button onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-red-400 hover:bg-red-500/10 transition-colors text-sm border-t border-white/5">
                          <LogOut className="w-3.5 h-3.5" /> Keluar
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Link to="/chat"
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-[#E31E24] hover:bg-[#A51419] text-white text-sm rounded-lg transition-all font-semibold shadow-md shadow-red-900/30">
                  <MessageSquare className="w-3.5 h-3.5" /> Chat
                </Link>
              </>
            ) : (
              <>
                <Link to="/login"
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 border border-white/10 text-slate-400 text-sm rounded-lg hover:bg-white/5 hover:text-white transition-all">
                  <LogIn className="w-3.5 h-3.5" /> Masuk
                </Link>
                <Link to="/chat"
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-[#E31E24] hover:bg-[#A51419] text-white text-sm rounded-lg transition-all font-semibold shadow-md shadow-red-900/30">
                  <MessageSquare className="w-3.5 h-3.5" /> Mulai Chat
                </Link>
              </>
            )}

            {/* Hamburger */}
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:bg-white/8 hover:text-white transition-all">
              <AnimatePresence mode="wait" initial={false}>
                {menuOpen
                  ? <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><X className="w-5 h-5" /></motion.span>
                  : <motion.span key="m" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><Menu className="w-5 h-5" /></motion.span>
                }
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu — animated */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="md:hidden overflow-hidden border-t border-white/5"
          >
            <div className="px-4 py-3 space-y-0.5 bg-[#0D0D0D]">
              {navLinks.map(({ to, label, icon: Icon }, i) => {
                const isActive = location.pathname === to;
                return (
                  <motion.div
                    key={to}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link to={to} onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? "bg-white/8 text-white border-l-2 border-[#E31E24] pl-3"
                          : "text-slate-400 hover:bg-white/5 hover:text-white"
                      }`}>
                      <Icon className="w-4 h-4 flex-shrink-0" />{label}
                    </Link>
                  </motion.div>
                );
              })}

              <div className="h-px bg-white/5 my-2" />

              {isLoggedIn && user ? (
                <>
                  <Link to="/profile" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-slate-400 hover:bg-white/5 hover:text-white transition-all">
                    <User className="w-4 h-4" /> Profil Saya
                  </Link>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#E31E24] to-[#5B1A8A] rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{user.name}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium capitalize ${rolePill}`}>
                        {user.role}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => { handleLogout(); setMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400 hover:bg-red-500/8 transition-all">
                    <LogOut className="w-4 h-4" /> Keluar
                  </button>
                </>
              ) : (
                <Link to="/login" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-slate-400 hover:bg-white/5 hover:text-white transition-all">
                  <LogIn className="w-4 h-4" /> Masuk
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {userMenuOpen && <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />}
    </nav>
  );
}
