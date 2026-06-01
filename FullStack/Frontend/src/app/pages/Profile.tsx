import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { User, Mail, LogOut, Pencil, Check, X, Loader2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5001/api/v1";

export function Profile() {
  const { user, logout, updateUser, refreshUser, authFetch } = useAuth();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(user?.name ?? "");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleEdit = () => {
    setDraftName(user?.name ?? "");
    setEditing(true);
    setSaved(false);
    setError("");
  };

  const handleCancel = () => {
    setEditing(false);
    setDraftName(user?.name ?? "");
    setError("");
  };

  const handleSave = async () => {
    const trimmed = draftName.trim();
    if (trimmed.length < 2 || trimmed === user?.name) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await authFetch(`${API_BASE}/auth/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: trimmed }),
        signal: AbortSignal.timeout(8000),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        if (res.status === 401) {
          setError("Sesi habis. Silakan login ulang.");
        } else if (json?.error?.details?.length) {
          setError(json.error.details[0].issue);
        } else {
          setError(json?.error?.message ?? "Gagal menyimpan perubahan.");
        }
        return;
      }
      const updated = json?.data?.user;
      updateUser({ name: updated?.name ?? trimmed });
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Server tidak dapat dijangkau. Coba lagi nanti.");
    } finally {
      setSaving(false);
    }
  };

  // styling role badge
  const rolePill = user?.role === "admin"
    ? "bg-amber-100 text-amber-700 border-amber-200"
    : "bg-blue-100 text-blue-700 border-blue-200";

  return (
    <div className="min-h-screen bg-slate-50 pb-10">

      {/* Header dengan avatar */}
      <section className="bg-gradient-to-br from-[#0D0D0D] via-[#1A0A2E] to-[#0D0D0D] text-white py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* avatar inisial */}
            <div className="w-20 h-20 bg-gradient-to-br from-[#CC0000] to-[#4B1E6B] rounded-3xl flex items-center justify-center mx-auto mb-4 text-3xl font-bold shadow-2xl shadow-red-900/50">
              {user?.name?.charAt(0) ?? "?"}
            </div>
            <h1 className="text-2xl font-bold">{user?.name ?? "Pengguna"}</h1>
            <p className="text-slate-400 text-sm mt-1">{user?.email}</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className={`text-xs px-2.5 py-1 rounded-full border font-medium capitalize ${rolePill}`}>
                {user?.role ?? "—"}
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 mt-6 space-y-4">

        {/* Info Akun */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
        >
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
            <User className="w-4 h-4 text-[#CC0000]" />
            <h2 className="text-slate-800 font-semibold text-sm">Informasi Akun</h2>
          </div>

          <div className="divide-y divide-slate-50">
            <div className="px-5 py-3.5">
              <p className="text-xs text-slate-400 mb-1.5">Nama Lengkap</p>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                {editing ? (
                  <>
                    <input
                      type="text"
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSave();
                        if (e.key === "Escape") handleCancel();
                      }}
                      autoFocus
                      maxLength={150}
                      disabled={saving}
                      className="flex-1 min-w-0 h-9 px-3 text-slate-800 text-sm font-medium border border-slate-200 rounded-lg focus:outline-none focus:border-[#CC0000] focus:ring-2 focus:ring-[#CC0000]/15 disabled:bg-slate-50"
                    />
                    <button
                      onClick={handleSave}
                      disabled={saving || draftName.trim().length < 2}
                      className="flex items-center gap-1 h-9 px-3 bg-[#CC0000] hover:bg-[#8B0000] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-all flex-shrink-0"
                    >
                      {saving
                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan</>
                        : <><Check className="w-3.5 h-3.5" /> Simpan</>}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="flex items-center justify-center h-9 w-9 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 rounded-lg transition-all flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <p className="flex-1 min-w-0 text-slate-800 text-sm font-medium truncate">
                      {user?.name ?? "—"}
                      {saved && <span className="ml-2 text-emerald-600 text-xs font-semibold">✓ Tersimpan</span>}
                    </p>
                    <button
                      onClick={handleEdit}
                      className="flex items-center gap-1 h-9 px-3 text-[#CC0000] hover:bg-red-50 text-xs font-semibold rounded-lg transition-all flex-shrink-0"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                  </>
                )}
              </div>
              {editing && error && (
                <p className="mt-2 ml-6 flex items-center gap-1.5 text-red-600 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {error}
                </p>
              )}
            </div>

            <div className="px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-400">Email</p>
                  <p className="text-slate-800 text-sm font-medium">{user?.email ?? "—"}</p>
                </div>
              </div>
            </div>

          </div>
        </motion.section>

        {/* Info project */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-gradient-to-br from-[#0D0D0D] to-[#1A0A2E] border border-[#CC0000]/20 rounded-2xl p-5 text-white"
        >
          <h2 className="text-sm font-semibold mb-3 text-[#FF4444]">Info Capstone Project</h2>
          <div className="grid grid-cols-2 gap-3 text-xs">
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
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 border border-red-200 text-red-500 bg-white rounded-2xl font-semibold text-sm hover:bg-red-50 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Keluar dari Akun
          </button>
        </motion.div>

        <p className="text-center text-slate-400 text-xs">
          Coding Camp 2026 × <span className="text-[#CC0000]">DBS Foundation</span>
        </p>
      </div>
    </div>
  );
}
