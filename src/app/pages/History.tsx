import { useState, useEffect } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Clock, MessageSquare, Trash2, Search, Bot,
  ChevronRight, AlertCircle, RotateCcw,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

// ─── Types ─────────────────────────────────────────────────────────────────
// timestamp disimpen sebagai ISO string (bukan Date) karena JSON.stringify
// ga bisa handle Date object dengan baik
interface HistoryItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  urgency: "low" | "medium" | "high";
  timestamp: string;
}

// styling badge urgency — harus sama persis sama Chat.tsx biar konsisten
const urgencyBadge: Record<string, string> = {
  low:    "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
  medium: "bg-amber-500/10 border-amber-500/30 text-yellow-400",
  high:   "bg-red-500/10 border-red-500/30 text-red-400",
};

const urgencyDot: Record<string, string> = {
  low: "bg-emerald-500",
  medium: "bg-amber-400",
  high: "bg-red-500",
};

// emoji per kategori — sama dengan Chat.tsx dan FAQ.tsx
const categoryEmoji: Record<string, string> = {
  Jadwal: "📅",
  Materi: "📚",
  Teknis: "⚙️",
  Tugas: "📝",
  Umum: "💬",
  Akun: "👤",
};

// key harus sama dengan HISTORY_KEY di Chat.tsx
// kalau beda data ga kebaca
const HISTORY_KEY = "cc_chat_history";

function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    // JSON corrupt — return array kosong daripada crash
    return [];
  }
}

// format ISO string ke format Indonesia yang readable
// contoh: "06 Mei 2026, 14:30"
function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Component ─────────────────────────────────────────────────────────────
export function History() {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  // load pas mount — jangan di render biasa karena localStorage cuma ada di browser
  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  // filter berdasarkan search — cek question dan category
  const filtered = history.filter((item) =>
    item.question.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  // hapus satu item
  const deleteItem = (id: string) => {
    const updated = history.filter((item) => item.id !== id);
    setHistory(updated);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    // tutup expanded kalau yang dihapus lagi dibuka
    if (expandedId === id) setExpandedId(null);
  };

  // hapus semua — setelah user konfirmasi
  const clearAll = () => {
    localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
    setConfirmClear(false);
    setExpandedId(null);
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D]">

      {/* Header */}
      <section className="bg-gradient-to-br from-[#0D0D0D] via-[#1A0A2E] to-[#0D0D0D] text-white py-10 border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-12 h-12 bg-[#CC0000]/20 border border-[#CC0000]/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Clock className="w-6 h-6 text-[#FF4444]" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Riwayat Chat</h1>
            <p className="text-slate-400 text-sm">
              Pertanyaan yang pernah kamu ajukan ke Coding Camp Copilot
              {user ? ` — ${user.name}` : ""}
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Search + tombol hapus semua */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari pertanyaan atau kategori..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30 focus:border-[#CC0000]/50 transition-all"
            />
          </div>

          {history.length > 0 && (
            <button
              onClick={() => setConfirmClear(true)}
              className="flex items-center gap-2 px-4 py-2.5 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/10 transition-all text-sm font-medium"
            >
              <Trash2 className="w-4 h-4" />
              Hapus Semua
            </button>
          )}
        </div>

        {/* Konfirmasi hapus semua — inline alert */}
        <AnimatePresence>
          {confirmClear && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-4 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3"
            >
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-sm flex-1">
                Yakin ingin menghapus semua riwayat? Tindakan ini tidak bisa diurungkan.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={clearAll}
                  className="px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg font-medium hover:bg-red-600 transition-colors"
                >
                  Ya, Hapus
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs rounded-lg font-medium hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state — belum pernah chat */}
        {history.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 bg-[#1E1428] border border-white/8 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-slate-500" />
            </div>
            <p className="text-white font-semibold mb-2">Belum ada riwayat chat</p>
            <p className="text-slate-500 text-sm mb-5 max-w-xs mx-auto">
              Mulai tanya ke Copilot — riwayat akan tersimpan otomatis di browser kamu.
            </p>
            <Link
              to="/chat"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#CC0000] text-white rounded-xl font-semibold text-sm hover:bg-[#8B0000] transition-all shadow-md"
            >
              <MessageSquare className="w-4 h-4" />
              Mulai Chat Sekarang
            </Link>
          </motion.div>
        )}

        {/* Tidak ada hasil search */}
        {history.length > 0 && filtered.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-8 h-8 mx-auto mb-3 text-slate-700" />
            <p className="text-slate-500 text-sm">Tidak ada hasil untuk &ldquo;{search}&rdquo;</p>
          </div>
        )}

        {/* Daftar histori */}
        <div className="space-y-2.5">
          {filtered.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-[#120A1C] border border-white/7 rounded-2xl overflow-hidden hover:border-[#CC0000]/30 hover:bg-[#180D28] transition-all duration-200 group"
            >
              {/* Header row — klik untuk expand/collapse */}
              <button
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/5 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-[#CC0000] to-[#8B0000] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  {/* truncate kalau pertanyaan panjang */}
                  <p className="text-slate-200 font-medium text-sm truncate">
                    {item.question}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-slate-400">
                      {categoryEmoji[item.category] ?? "💬"} {item.category}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex items-center gap-1 ${urgencyBadge[item.urgency]}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${urgencyDot[item.urgency]}`} />
                      {item.urgency.charAt(0).toUpperCase() + item.urgency.slice(1)}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(item.timestamp)}
                    </span>
                  </div>
                </div>

                <ChevronRight
                  className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
                    expandedId === item.id ? "rotate-90 text-[#CC0000]" : ""
                  }`}
                />
              </button>

              {/* Expanded — jawaban yang tersimpan */}
              <AnimatePresence>
                {expandedId === item.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-4 pb-4 pt-3 border-t border-white/8">
                      {/* whitespace-pre-line supaya newline tetap kelihatan */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 mb-3">
                        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                          {item.answer}
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <Link
                          to="/chat"
                          className="text-xs text-[#CC0000] hover:underline flex items-center gap-1 font-medium"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Tanyakan lagi di Chat
                        </Link>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Hapus
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Info penyimpanan */}
        {history.length > 0 && (
          <p className="text-center text-slate-400 text-xs mt-6">
            {history.length} riwayat tersimpan di browser ini ·{" "}
            <span className="text-slate-500">Terhapus jika clear storage</span>
          </p>
        )}
      </div>
    </div>
  );
}
