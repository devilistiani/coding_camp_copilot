import { useState } from "react";
import { Navigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Users, MessageSquare, Search, Trash2, ShieldCheck,
  Mail, Clock, ChevronRight, AlertCircle, Ban, CheckCircle2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

type TabKey = "peserta" | "chat";

interface PesertaItem {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
  chatCount: number;
  status: "aktif" | "nonaktif";
}

interface ChatItem {
  id: string;
  userName: string;
  userEmail: string;
  lastQuestion: string;
  category: string;
  urgency: "low" | "medium" | "high";
  timestamp: string;
}

type ActionType = "deactivate" | "activate" | "delete";

interface ConfirmAction {
  type: ActionType;
  peserta: PesertaItem;
}

const INITIAL_PESERTA: PesertaItem[] = [
  { id: "p1", name: "Rizki Alsyareno",     email: "rizki@codingcamp.id",     joinedAt: "12 Mei 2026", chatCount: 24, status: "nonaktif" },
  { id: "p2", name: "Siti Nur Padila",     email: "siti@codingcamp.id",      joinedAt: "12 Mei 2026", chatCount: 19, status: "aktif"    },
  { id: "p3", name: "Anthony Saputra",     email: "anthony@codingcamp.id",   joinedAt: "10 Mei 2026", chatCount: 12, status: "aktif"    },
  { id: "p4", name: "Devi Listiani",       email: "devi@codingcamp.id",      joinedAt: "08 Mei 2026", chatCount: 7,  status: "aktif"    },
  { id: "p5", name: "Naila Hilwatus",      email: "naila@codingcamp.id",     joinedAt: "05 Mei 2026", chatCount: 18, status: "aktif"    },
  { id: "p6", name: "Gabriella Elizabeth", email: "gabriella@codingcamp.id", joinedAt: "05 Mei 2026", chatCount: 15, status: "aktif"    },
];

const MOCK_CHATS: ChatItem[] = [
  { id: "c1", userName: "Rizki Alsyareno", userEmail: "rizki@codingcamp.id",   lastQuestion: "Kapan deadline submission capstone project?", category: "Jadwal", urgency: "high",   timestamp: "29 Mei 2026, 14:30" },
  { id: "c2", userName: "Anthony Saputra", userEmail: "anthony@codingcamp.id", lastQuestion: "Error saat training TensorFlow model BiLSTM",  category: "Teknis", urgency: "high",   timestamp: "29 Mei 2026, 12:15" },
  { id: "c3", userName: "Devi Listiani",   userEmail: "devi@codingcamp.id",    lastQuestion: "Cara setup A/B testing IndoBERT vs TF-IDF?",  category: "Materi", urgency: "medium", timestamp: "28 Mei 2026, 21:45" },
  { id: "c4", userName: "Rizki Alsyareno", userEmail: "rizki@codingcamp.id",   lastQuestion: "Bisa pakai Express buat REST API?",          category: "Teknis", urgency: "low",    timestamp: "28 Mei 2026, 18:02" },
];

const urgencyStyle: Record<ChatItem["urgency"], string> = {
  low:    "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
  medium: "bg-amber-500/10 border-amber-500/30 text-yellow-400",
  high:   "bg-red-500/10 border-red-500/30 text-red-400",
};

const actionConfig: Record<ActionType, {
  title: string;
  description: (name: string) => string;
  confirmLabel: string;
  icon: typeof Ban;
  iconBg: string;
  iconColor: string;
  confirmClass: string;
}> = {
  deactivate: {
    title: "Nonaktifkan Peserta?",
    description: (name) => `Akun ${name} akan dinonaktifkan dan tidak bisa login sampai diaktifkan kembali.`,
    confirmLabel: "Nonaktifkan",
    icon: Ban,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    confirmClass: "bg-amber-500 hover:bg-amber-600",
  },
  activate: {
    title: "Aktifkan Peserta?",
    description: (name) => `Akun ${name} akan kembali aktif dan bisa login.`,
    confirmLabel: "Aktifkan",
    icon: CheckCircle2,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    confirmClass: "bg-emerald-500 hover:bg-emerald-600",
  },
  delete: {
    title: "Hapus Peserta?",
    description: (name) => `Akun ${name} dan seluruh riwayat chat-nya akan dihapus permanen.`,
    confirmLabel: "Hapus",
    icon: Trash2,
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    confirmClass: "bg-red-500 hover:bg-red-600",
  },
};

export function Admin() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>("peserta");
  const [search, setSearch] = useState("");
  const [pesertas, setPesertas] = useState<PesertaItem[]>(INITIAL_PESERTA);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  if (user?.role !== "admin") return <Navigate to="/" replace />;

  const filteredPeserta = pesertas.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredChats = MOCK_CHATS.filter(
    (c) =>
      c.userName.toLowerCase().includes(search.toLowerCase()) ||
      c.lastQuestion.toLowerCase().includes(search.toLowerCase()),
  );

  const handleConfirm = () => {
    if (!confirmAction) return;
    const { type, peserta } = confirmAction;
    if (type === "delete") {
      setPesertas((prev) => prev.filter((p) => p.id !== peserta.id));
    } else {
      setPesertas((prev) =>
        prev.map((p) =>
          p.id === peserta.id ? { ...p, status: type === "activate" ? "aktif" : "nonaktif" } : p,
        ),
      );
    }
    setConfirmAction(null);
  };

  const modalCfg = confirmAction ? actionConfig[confirmAction.type] : null;
  const ModalIcon = modalCfg?.icon;

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <section className="bg-gradient-to-br from-[#0D0D0D] via-[#1A0A2E] to-[#0D0D0D] text-white py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-[#CC0000] to-[#4B1E6B] rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Admin Panel</h1>
                <p className="text-slate-400 text-sm">Kelola peserta dan pantau aktivitas chat</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-6">
        <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-200 p-1 mb-4 w-full max-w-md">
          <button
            onClick={() => setActiveTab("peserta")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "peserta"
                ? "bg-[#CC0000] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Users className="w-4 h-4" /> Kelola Peserta
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "chat"
                ? "bg-[#CC0000] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <MessageSquare className="w-4 h-4" /> Riwayat Chat
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={activeTab === "peserta" ? "Cari nama atau email peserta..." : "Cari berdasarkan peserta atau pertanyaan..."}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#CC0000] focus:ring-2 focus:ring-[#CC0000]/15"
          />
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
        >
          {activeTab === "peserta" ? (
            <>
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#CC0000]" />
                  <h2 className="text-slate-800 font-semibold text-sm">Daftar Peserta</h2>
                </div>
                <span className="text-xs text-slate-500">
                  {filteredPeserta.length} dari {pesertas.length} peserta
                </span>
              </div>
              {filteredPeserta.length === 0 ? (
                <div className="p-10 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                  <AlertCircle className="w-8 h-8" />
                  Tidak ada peserta yang cocok dengan pencarian
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredPeserta.map((p) => (
                    <div key={p.id} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#CC0000] to-[#4B1E6B] rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {p.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-slate-800 text-sm font-semibold truncate">{p.name}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                            p.status === "aktif"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}>
                            {p.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {p.email}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {p.joinedAt}</span>
                          <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {p.chatCount} chat</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {p.status === "aktif" ? (
                          <button
                            onClick={() => setConfirmAction({ type: "deactivate", peserta: p })}
                            className="flex items-center justify-center h-8 w-8 text-slate-400 hover:text-amber-600 hover:bg-amber-500/10 rounded-lg transition-all"
                            title="Nonaktifkan peserta"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setConfirmAction({ type: "activate", peserta: p })}
                            className="flex items-center justify-center h-8 w-8 text-slate-400 hover:text-emerald-600 hover:bg-emerald-500/10 rounded-lg transition-all"
                            title="Aktifkan peserta"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setConfirmAction({ type: "delete", peserta: p })}
                          className="flex items-center justify-center h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Hapus peserta"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#CC0000]" />
                  <h2 className="text-slate-800 font-semibold text-sm">Riwayat Chat Semua Peserta</h2>
                </div>
                <span className="text-xs text-slate-500">
                  {filteredChats.length} dari {MOCK_CHATS.length} chat
                </span>
              </div>
              {filteredChats.length === 0 ? (
                <div className="p-10 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                  <AlertCircle className="w-8 h-8" />
                  Tidak ada chat yang cocok dengan pencarian
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredChats.map((c) => (
                    <div key={c.id} className="px-5 py-4 flex items-start gap-3 hover:bg-slate-50 transition-colors cursor-pointer group">
                      <div className="w-8 h-8 bg-gradient-to-br from-slate-400 to-slate-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                        {c.userName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="text-slate-800 text-sm font-semibold">{c.userName}</p>
                          <span className="text-xs text-slate-400">·</span>
                          <span className="text-xs text-slate-500">{c.timestamp}</span>
                        </div>
                        <p className="text-slate-700 text-sm mb-2 line-clamp-1">{c.lastQuestion}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] px-2 py-0.5 rounded-full border bg-slate-50 text-slate-600 border-slate-200 font-medium">
                            {c.category}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium capitalize ${urgencyStyle[c.urgency]}`}>
                            {c.urgency}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#CC0000] transition-colors mt-1 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </motion.div>

        <p className="text-center text-slate-400 text-xs mt-6">
          Data masih dummy — akan terhubung ke backend pada sprint berikutnya
        </p>
      </div>

      <AnimatePresence>
        {confirmAction && modalCfg && ModalIcon && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setConfirmAction(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-full ${modalCfg.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <ModalIcon className={`w-6 h-6 ${modalCfg.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-slate-900 text-lg font-semibold">{modalCfg.title}</h3>
                  <p className="text-slate-600 text-sm mt-1 leading-relaxed">
                    {modalCfg.description(confirmAction.peserta.name)}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="px-4 h-10 text-slate-700 hover:bg-slate-100 text-sm font-semibold rounded-lg transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirm}
                  className={`px-4 h-10 text-white text-sm font-semibold rounded-lg transition-all ${modalCfg.confirmClass}`}
                >
                  {modalCfg.confirmLabel}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
