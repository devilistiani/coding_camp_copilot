import { useState } from "react";
import { motion } from "motion/react";
import { User, Mail, LogOut, Pencil, Check, X, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";

export function Profile() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(user?.name ?? "");
  const [saved, setSaved] = useState(false);

  const handleLogout = () => { logout(); navigate("/login"); };

  const handleEdit = () => { setDraftName(user?.name ?? ""); setEditing(true); setSaved(false); };
  const handleCancel = () => { setEditing(false); setDraftName(user?.name ?? ""); };
  const handleSave = () => {
    const trimmed = draftName.trim();
    if (trimmed.length < 2 || trimmed === user?.name) { setEditing(false); return; }
    updateUser({ name: trimmed });
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const rolePill = user?.role === "admin"
    ? "bg-amber-500/15 border-amber-400/30 text-amber-300"
    : "bg-violet-500/15 border-violet-400/30 text-violet-300";

  return (
    <div className="min-h-screen bg-[#0D0D0D] pb-12">

      {/* Header */}
      <section className="bg-gradient-to-br from-[#0D0D0D] via-[#1A0A2E] to-[#0D0D0D] border-b border-[#CC0000]/15 py-14">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="relative inline-block mb-5">
              <div className="w-22 h-22 w-[88px] h-[88px] bg-gradient-to-br from-[#CC0000] to-[#4B1E6B] rounded-3xl flex items-center justify-center mx-auto text-3xl font-bold shadow-2xl shadow-red-900/50 text-white">
                {user?.name?.charAt(0).toUpperCase() ?? "?"}
              </div>
              {user?.role === "admin" && (
                <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center shadow-lg">
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            <h1 className="text-white text-2xl font-bold">{user?.name ?? "Pengguna"}</h1>
            <p className="text-slate-400 text-sm mt-1">{user?.email}</p>
            <span className={`inline-block mt-3 text-xs px-3 py-1 rounded-full border font-medium capitalize ${rolePill}`}>
              {user?.role ?? "—"}
            </span>
          </motion.div>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 mt-6 space-y-4">

        {/* Info Akun */}
        <motion.section
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-[#130B1E] border border-white/8 rounded-2xl overflow-hidden"
        >
          <div className="px-5 py-3.5 border-b border-white/5 flex items-center gap-2">
            <User className="w-4 h-4 text-[#CC0000]" />
            <h2 className="text-white font-semibold text-sm">Informasi Akun</h2>
          </div>

          <div className="divide-y divide-white/5">
            {/* Nama */}
            <div className="px-5 py-4">
              <p className="text-xs text-slate-500 mb-2">Nama Lengkap</p>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-600 flex-shrink-0" />
                {editing ? (
                  <>
                    <input
                      type="text" value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleCancel(); }}
                      autoFocus maxLength={150}
                      className="flex-1 min-w-0 h-9 px-3 bg-white/5 text-white text-sm font-medium border border-white/20 rounded-lg focus:outline-none focus:border-[#CC0000] focus:ring-2 focus:ring-[#CC0000]/20"
                    />
                    <button onClick={handleSave} disabled={draftName.trim().length < 2}
                      className="flex items-center gap-1 h-9 px-3 bg-[#CC0000] hover:bg-[#8B0000] disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-all flex-shrink-0">
                      <Check className="w-3.5 h-3.5" /> Simpan
                    </button>
                    <button onClick={handleCancel}
                      className="flex items-center justify-center h-9 w-9 bg-white/5 hover:bg-white/10 text-slate-400 rounded-lg transition-all flex-shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <p className="flex-1 min-w-0 text-white text-sm font-medium truncate">
                      {user?.name ?? "—"}
                      {saved && <span className="ml-2 text-emerald-400 text-xs font-semibold">✓ Tersimpan</span>}
                    </p>
                    <button onClick={handleEdit}
                      className="flex items-center gap-1 h-9 px-3 text-[#FF4444] hover:bg-[#CC0000]/10 text-xs font-semibold rounded-lg transition-all flex-shrink-0">
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="px-5 py-4 flex items-center gap-3">
              <Mail className="w-4 h-4 text-slate-600 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Email</p>
                <p className="text-white text-sm font-medium">{user?.email ?? "—"}</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Info Capstone */}
        <motion.section
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-[#0D0D0D] to-[#1A0A2E] border border-[#CC0000]/20 rounded-2xl p-5"
        >
          <h2 className="text-[#FF4444] text-xs font-bold uppercase tracking-widest mb-4">Info Capstone Project</h2>
          <div className="grid grid-cols-2 gap-4 text-xs">
            {[
              { label: "ID Tim",    val: "CC26-PSU096" },
              { label: "Tema",      val: "Accessible & Adaptive Learning" },
              { label: "Program",   val: "Coding Camp 2026" },
              { label: "Sponsor",   val: "DBS Foundation" },
              { label: "Stack AI",  val: "TensorFlow + RAG" },
              { label: "Stack Web", val: "React + Express.js" },
            ].map(({ label, val }) => (
              <div key={label}>
                <p className="text-slate-500">{label}</p>
                <p className="text-slate-200 font-medium mt-0.5">{val}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Logout */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <button onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3.5 border border-red-900/40 text-red-400 bg-red-950/20 hover:bg-red-950/40 rounded-2xl font-semibold text-sm transition-all">
            <LogOut className="w-4 h-4" />
            Keluar dari Akun
          </button>
        </motion.div>

        <p className="text-center text-slate-600 text-xs">
          Coding Camp 2026 × <span className="text-[#CC0000]">DBS Foundation</span>
        </p>
      </div>
    </div>
  );
}
