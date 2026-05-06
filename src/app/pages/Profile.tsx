import { useState } from "react";
import { motion } from "motion/react";
import {
  User, Mail, Shield, Bell, Moon, Sun,
  LogOut, Save, ChevronRight, Info,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import useLocalStorage from "../hooks/useLocalStorage";

// preferensi user yang disimpen di localStorage
interface UserPrefs {
  darkMode: boolean;
  notifEnabled: boolean;
  showDraftReply: boolean; // khusus fasilitator
  language: "id" | "en";
}

// default kalau belum pernah set
const DEFAULT_PREFS: UserPrefs = {
  darkMode: false,
  notifEnabled: true,
  showDraftReply: true,
  language: "id",
};

// toggle switch component — reusable
// props simple: checked state + onChange handler
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
        checked ? "bg-[#CC0000]" : "bg-slate-200"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [prefs, setPrefs] = useLocalStorage<UserPrefs>("cc_prefs", DEFAULT_PREFS);
  const [saved, setSaved] = useState(false);

  // update satu field — spread yang lain biar ga ilang
  const updatePref = <K extends keyof UserPrefs>(key: K, value: UserPrefs[K]) => {
    setPrefs({ ...prefs, [key]: value });
  };

  const handleSave = () => {
    // preferensi sudah auto-save via useLocalStorage
    // ini cuma buat feedback visual ke user
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // styling role badge
  const rolePill = user?.role === "fasilitator"
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
              <span className="text-slate-500 text-xs font-mono">{user?.id}</span>
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
            <div className="px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-400">Nama Lengkap</p>
                  <p className="text-slate-800 text-sm font-medium">{user?.name ?? "—"}</p>
                </div>
              </div>
              {/* chevron ada tapi belum fungsi — edit profil belum diimplementasi */}
              {/* TODO: buka form edit nama waktu diklik */}
              <ChevronRight className="w-4 h-4 text-slate-300" />
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

            <div className="px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-400">Role</p>
                  <p className="text-slate-800 text-sm font-medium capitalize">{user?.role ?? "—"}</p>
                </div>
              </div>
              {user?.role === "fasilitator" && (
                <span className="text-xs bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                  ✨ Draft Reply Aktif
                </span>
              )}
            </div>
          </div>
        </motion.section>

        {/* Preferensi */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
        >
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#CC0000]" />
            <h2 className="text-slate-800 font-semibold text-sm">Preferensi Aplikasi</h2>
          </div>

          <div className="divide-y divide-slate-50">
            <div className="px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-slate-700 text-sm font-medium">Notifikasi</p>
                  <p className="text-slate-400 text-xs">Tampilkan notifikasi di browser</p>
                </div>
              </div>
              <Toggle checked={prefs.notifEnabled} onChange={(v) => updatePref("notifEnabled", v)} />
            </div>

            {/* dark mode — togglenya ada tapi belum fully implemented */}
            {/* perlu extend Root.tsx dan tambah class ke html element */}
            {/* TODO: implementasi theme switching di sprint berikutnya */}
            <div className="px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {prefs.darkMode ? <Moon className="w-4 h-4 text-slate-400" /> : <Sun className="w-4 h-4 text-slate-400" />}
                <div>
                  <p className="text-slate-700 text-sm font-medium">Mode Gelap</p>
                  <p className="text-slate-400 text-xs">Tema dark untuk tampilan malam</p>
                </div>
              </div>
              <Toggle checked={prefs.darkMode} onChange={(v) => updatePref("darkMode", v)} />
            </div>

            {/* draft reply toggle — khusus fasilitator */}
            {user?.role === "fasilitator" && (
              <div className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Info className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-slate-700 text-sm font-medium">Draft Reply Otomatis</p>
                    <p className="text-slate-400 text-xs">Tampilkan draft di setiap jawaban AI</p>
                  </div>
                </div>
                <Toggle checked={prefs.showDraftReply} onChange={(v) => updatePref("showDraftReply", v)} />
              </div>
            )}

            <div className="px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Info className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-slate-700 text-sm font-medium">Bahasa Antarmuka</p>
                  <p className="text-slate-400 text-xs">Pilih bahasa tampilan aplikasi</p>
                </div>
              </div>
              <select
                value={prefs.language}
                onChange={(e) => updatePref("language", e.target.value as "id" | "en")}
                className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20"
              >
                <option value="id">🇮🇩 Indonesia</option>
                <option value="en">🇺🇸 English</option>
              </select>
            </div>
          </div>

          <div className="px-5 py-4 bg-slate-50 border-t border-slate-100">
            <button
              onClick={handleSave}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                saved
                  ? "bg-emerald-500 text-white"
                  : "bg-[#CC0000] hover:bg-[#8B0000] text-white shadow-md shadow-red-900/20"
              }`}
            >
              <Save className="w-4 h-4" />
              {saved ? "✓ Tersimpan!" : "Simpan Preferensi"}
            </button>
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
