import { useState, useEffect, useCallback, ReactNode } from "react";
import { Navigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Users, MessageSquare, Search, Trash2, ShieldCheck,
  Mail, Clock, ChevronRight, AlertCircle, Ban, CheckCircle2, Loader2,
  BarChart3, TrendingUp, Bot, Activity,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Markdown } from "../components/Markdown";
import { Pagination } from "../components/Pagination";

const PAGE_SIZE = 10;

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5001/api/v1";

type TabKey = "peserta" | "chat" | "analytics";

interface AnalyticsData {
  generated_at: string;
  users: {
    total: number;
    active: number;
    inactive: number;
    by_role: { peserta: number; admin: number };
    new_last_7_days: number;
  };
  conversations: {
    total: number;
    new_today: number;
    new_last_7_days: number;
  };
  messages: {
    total: number;
    by_sender: { user: number; ai: number };
    new_today: number;
    new_last_7_days: number;
  };
  ai: {
    avg_confidence: number | null;
    by_category: Array<{ category: string; count: number }>;
    by_urgency: { low: number; medium: number; high: number };
  };
  daily_trend_last_30_days: Array<{ date: string; conversations: number; messages: number }>;
}

interface PesertaItem {
  id: string;
  name: string;
  email: string;
  role: "peserta" | "admin";
  joinedAt: string;
  chatCount: number;
  status: "aktif" | "nonaktif";
}

interface ChatItem {
  id: string;
  userName: string;
  userEmail: string;
  title: string;
  messageCount: number;
  timestamp: string;
}

interface ChatMessageDetail {
  id: string;
  sender_type: "user" | "ai";
  content: string;
  category: string | null;
  urgency: "low" | "medium" | "high" | null;
  confidence: number | null;
  draft_reply: string | null;
  created_at: string;
}

type ActionType = "deactivate" | "activate" | "delete";

interface ConfirmAction {
  type: ActionType;
  peserta: PesertaItem;
}

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

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function Admin() {
  const { user, authFetch } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>("peserta");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pesertas, setPesertas] = useState<PesertaItem[]>([]);
  const [pesertaPage, setPesertaPage] = useState(1);
  const [pesertaTotal, setPesertaTotal] = useState(0);
  const [pesertaTotalPages, setPesertaTotalPages] = useState(1);
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [chatPage, setChatPage] = useState(1);
  const [chatTotal, setChatTotal] = useState(0);
  const [chatTotalPages, setChatTotalPages] = useState(1);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [expandedChatId, setExpandedChatId] = useState<string | null>(null);
  const [chatDetailCache, setChatDetailCache] = useState<Record<string, ChatMessageDetail[]>>({});
  const [loadingChatDetail, setLoadingChatDetail] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPesertaPage(1);
    setChatPage(1);
  }, [debouncedSearch, activeTab]);

  const fetchUsers = useCallback(async (page: number, q: string) => {
    setLoadingUsers(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (q) params.set("q", q);
      const res = await authFetch(`${API_BASE}/admin/users?${params}`, {
        signal: AbortSignal.timeout(10000),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.error?.message ?? "Gagal memuat daftar peserta");
        return;
      }
      const items = (json?.data?.items ?? []) as Array<{
        id: string;
        email: string;
        full_name: string;
        role: "peserta" | "admin";
        is_active: boolean;
        chat_count: number;
        joined_at: string;
      }>;
      const pagination = json?.data?.pagination as { total: number; total_pages: number } | undefined;
      setPesertas(
        items.map((u) => ({
          id: u.id,
          name: u.full_name,
          email: u.email,
          role: u.role,
          joinedAt: formatDate(u.joined_at),
          chatCount: u.chat_count,
          status: u.is_active ? "aktif" : "nonaktif",
        })),
      );
      setPesertaTotal(pagination?.total ?? 0);
      setPesertaTotalPages(pagination?.total_pages ?? 1);
    } catch {
      setError("Server tidak dapat dijangkau. Coba lagi nanti.");
    } finally {
      setLoadingUsers(false);
    }
  }, [authFetch]);

  const fetchConversations = useCallback(async (page: number, q: string) => {
    setLoadingChats(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (q) params.set("q", q);
      const res = await authFetch(`${API_BASE}/conversations?${params}`, {
        signal: AbortSignal.timeout(10000),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.error?.message ?? "Gagal memuat riwayat chat");
        return;
      }
      const items = (json?.data?.items ?? []) as Array<{
        id: string;
        title: string | null;
        message_count: number;
        updated_at: string;
        user?: { id: string; email: string; full_name: string };
      }>;
      const pagination = json?.data?.pagination as { total: number; total_pages: number } | undefined;
      setChats(
        items.map((c) => ({
          id: c.id,
          userName: c.user?.full_name ?? "—",
          userEmail: c.user?.email ?? "",
          title: c.title ?? "(Tanpa judul)",
          messageCount: c.message_count,
          timestamp: formatDateTime(c.updated_at),
        })),
      );
      setChatTotal(pagination?.total ?? 0);
      setChatTotalPages(pagination?.total_pages ?? 1);
      setExpandedChatId(null);
    } catch {
      setError("Server tidak dapat dijangkau. Coba lagi nanti.");
    } finally {
      setLoadingChats(false);
    }
  }, [authFetch]);

  const fetchAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    setError("");
    try {
      const res = await authFetch(`${API_BASE}/admin/analytics/summary`, {
        signal: AbortSignal.timeout(15000),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.error?.message ?? "Gagal memuat analytics");
        return;
      }
      setAnalytics(json?.data as AnalyticsData);
    } catch {
      setError("Server tidak dapat dijangkau. Coba lagi nanti.");
    } finally {
      setLoadingAnalytics(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (user?.role !== "admin") return;
    if (activeTab === "peserta") fetchUsers(pesertaPage, debouncedSearch);
  }, [activeTab, user?.role, pesertaPage, debouncedSearch, fetchUsers]);

  useEffect(() => {
    if (user?.role !== "admin") return;
    if (activeTab === "chat") fetchConversations(chatPage, debouncedSearch);
  }, [activeTab, user?.role, chatPage, debouncedSearch, fetchConversations]);

  useEffect(() => {
    if (user?.role !== "admin") return;
    if (activeTab === "analytics") fetchAnalytics();
  }, [activeTab, user?.role, fetchAnalytics]);

  if (user?.role !== "admin") return <Navigate to="/" replace />;

  const handleExpandChat = async (chatId: string) => {
    if (expandedChatId === chatId) {
      setExpandedChatId(null);
      return;
    }
    setExpandedChatId(chatId);
    if (chatDetailCache[chatId]) return;
    setLoadingChatDetail(chatId);
    try {
      const res = await authFetch(`${API_BASE}/conversations/${chatId}`, {
        signal: AbortSignal.timeout(10000),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.error?.message ?? "Gagal memuat detail chat");
        return;
      }
      const messages = (json?.data?.messages ?? []) as ChatMessageDetail[];
      setChatDetailCache((prev) => ({ ...prev, [chatId]: messages }));
    } catch {
      setError("Server tidak dapat dijangkau. Coba lagi nanti.");
    } finally {
      setLoadingChatDetail(null);
    }
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;
    const { type, peserta } = confirmAction;
    setProcessingId(peserta.id);
    setError("");
    try {
      if (type === "delete") {
        const res = await authFetch(`${API_BASE}/admin/users/${peserta.id}`, {
          method: "DELETE",
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok && res.status !== 204) {
          const json = await res.json().catch(() => null);
          setError(json?.error?.message ?? "Gagal menghapus peserta");
          return;
        }
        const isLastOnPage = pesertas.length === 1 && pesertaPage > 1;
        if (isLastOnPage) {
          setPesertaPage((p) => p - 1);
        } else {
          await fetchUsers(pesertaPage, debouncedSearch);
        }
      } else {
        const isActive = type === "activate";
        const res = await authFetch(`${API_BASE}/admin/users/${peserta.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: isActive }),
          signal: AbortSignal.timeout(10000),
        });
        const json = await res.json().catch(() => null);
        if (!res.ok) {
          setError(json?.error?.message ?? "Gagal mengubah status peserta");
          return;
        }
        setPesertas((prev) =>
          prev.map((p) =>
            p.id === peserta.id ? { ...p, status: isActive ? "aktif" : "nonaktif" } : p,
          ),
        );
      }
      setConfirmAction(null);
    } catch {
      setError("Server tidak dapat dijangkau. Coba lagi nanti.");
    } finally {
      setProcessingId(null);
    }
  };

  const modalCfg = confirmAction ? actionConfig[confirmAction.type] : null;
  const ModalIcon = modalCfg?.icon;
  const isProcessing = processingId === confirmAction?.peserta.id;

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <section className="bg-gradient-to-br from-[#0D0D0D] via-[#1A0A2E] to-[#0D0D0D] text-white py-8 sm:py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-[#CC0000] to-[#4B1E6B] rounded-xl flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold">Admin Panel</h1>
                <p className="text-slate-400 text-xs sm:text-sm">Kelola peserta dan pantau aktivitas chat</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-6">
        <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-200 p-1 mb-4 w-full sm:max-w-xl">
          <button
            onClick={() => setActiveTab("peserta")}
            className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === "peserta"
                ? "bg-[#CC0000] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Users className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline">Kelola Peserta</span>
            <span className="sm:hidden">Peserta</span>
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === "chat"
                ? "bg-[#CC0000] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <MessageSquare className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline">Riwayat Chat</span>
            <span className="sm:hidden">Chat</span>
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === "analytics"
                ? "bg-[#CC0000] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <BarChart3 className="w-4 h-4 flex-shrink-0" />
            Analytics
          </button>
        </div>

        {activeTab !== "analytics" && (
          <div className="relative mb-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={activeTab === "peserta" ? "Cari nama atau email peserta..." : "Cari berdasarkan peserta atau judul chat..."}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#CC0000] focus:ring-2 focus:ring-[#CC0000]/15"
            />
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className={activeTab === "analytics" ? "" : "bg-white rounded-2xl border border-slate-200 overflow-hidden"}
        >
          {activeTab === "analytics" ? (
            <AnalyticsPanel data={analytics} loading={loadingAnalytics} />
          ) : activeTab === "peserta" ? (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#CC0000]" />
                  <h2 className="text-slate-800 font-semibold text-sm">Daftar Peserta</h2>
                </div>
                <span className="text-xs text-slate-500">
                  Total {pesertaTotal} peserta
                </span>
              </div>
              {loadingUsers ? (
                <div className="p-10 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  Memuat daftar peserta...
                </div>
              ) : pesertas.length === 0 ? (
                <div className="p-10 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                  <AlertCircle className="w-8 h-8" />
                  {debouncedSearch ? "Tidak ada peserta yang cocok dengan pencarian" : "Belum ada peserta terdaftar"}
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {pesertas.map((p) => (
                    <div key={p.id} className="px-4 sm:px-5 py-4 flex items-start gap-3 sm:gap-4 hover:bg-slate-50 transition-colors">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-[#CC0000] to-[#4B1E6B] rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {p.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-slate-800 text-sm font-semibold truncate max-w-full">{p.name}</p>
                          {p.role === "admin" && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">
                              admin
                            </span>
                          )}
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                            p.status === "aktif"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}>
                            {p.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1 max-w-full min-w-0">
                            <Mail className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{p.email}</span>
                          </span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {p.joinedAt}</span>
                          <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {p.chatCount} chat</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {p.status === "aktif" ? (
                          <button
                            onClick={() => setConfirmAction({ type: "deactivate", peserta: p })}
                            disabled={processingId === p.id}
                            className="flex items-center justify-center h-8 w-8 text-slate-400 hover:text-amber-600 hover:bg-amber-50 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-all"
                            title="Nonaktifkan peserta"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setConfirmAction({ type: "activate", peserta: p })}
                            disabled={processingId === p.id}
                            className="flex items-center justify-center h-8 w-8 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-all"
                            title="Aktifkan peserta"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setConfirmAction({ type: "delete", peserta: p })}
                          disabled={processingId === p.id}
                          className="flex items-center justify-center h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-all"
                          title="Hapus peserta"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Pagination
                page={pesertaPage}
                totalPages={pesertaTotalPages}
                total={pesertaTotal}
                limit={PAGE_SIZE}
                onPageChange={setPesertaPage}
                disabled={loadingUsers}
                itemLabel="peserta"
              />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#CC0000]" />
                  <h2 className="text-slate-800 font-semibold text-sm">Riwayat Chat Semua Peserta</h2>
                </div>
                <span className="text-xs text-slate-500">
                  Total {chatTotal} chat
                </span>
              </div>
              {loadingChats ? (
                <div className="p-10 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  Memuat riwayat chat...
                </div>
              ) : chats.length === 0 ? (
                <div className="p-10 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                  <AlertCircle className="w-8 h-8" />
                  {debouncedSearch ? "Tidak ada chat yang cocok dengan pencarian" : "Belum ada riwayat chat"}
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {chats.map((c) => {
                    const isExpanded = expandedChatId === c.id;
                    const messages = chatDetailCache[c.id];
                    return (
                      <div key={c.id} className="overflow-hidden">
                        <button
                          onClick={() => handleExpandChat(c.id)}
                          className="w-full text-left px-4 sm:px-5 py-4 flex items-start gap-3 hover:bg-slate-50 transition-colors group"
                        >
                          <div className="w-8 h-8 bg-gradient-to-br from-slate-400 to-slate-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                            {c.userName.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p className="text-slate-800 text-sm font-semibold truncate max-w-full">{c.userName}</p>
                              <span className="text-xs text-slate-400 hidden sm:inline">·</span>
                              <span className="text-xs text-slate-500 truncate">{c.userEmail}</span>
                              <span className="text-xs text-slate-400 hidden sm:inline">·</span>
                              <span className="text-xs text-slate-500">{c.timestamp}</span>
                            </div>
                            <p className="text-slate-700 text-sm mb-2 line-clamp-2 sm:line-clamp-1">{c.title}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] px-2 py-0.5 rounded-full border bg-slate-50 text-slate-600 border-slate-200 font-medium">
                                {c.messageCount} pesan
                              </span>
                            </div>
                          </div>
                          <ChevronRight
                            className={`w-4 h-4 text-slate-300 group-hover:text-[#CC0000] transition-all mt-1 flex-shrink-0 ${
                              isExpanded ? "rotate-90 text-[#CC0000]" : ""
                            }`}
                          />
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <div className="px-4 sm:px-5 pb-4 pt-2 bg-slate-50/50 border-t border-slate-100">
                                {loadingChatDetail === c.id ? (
                                  <div className="flex items-center justify-center gap-2 py-6 text-slate-400 text-sm">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Memuat percakapan...
                                  </div>
                                ) : !messages || messages.length === 0 ? (
                                  <div className="py-6 text-center text-slate-400 text-sm">Belum ada pesan.</div>
                                ) : (
                                  <div className="space-y-2 pt-3">
                                    {messages.map((m) => (
                                      <div
                                        key={m.id}
                                        className={`rounded-xl p-3 border ${
                                          m.sender_type === "user"
                                            ? "bg-[#CC0000]/5 border-[#CC0000]/20 ml-0 sm:ml-6"
                                            : "bg-white border-slate-200 mr-0 sm:mr-6"
                                        }`}
                                      >
                                        <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
                                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                            {m.sender_type === "user" ? c.userName : "Copilot AI"}
                                          </span>
                                          <span className="text-[10px] text-slate-400">
                                            {new Date(m.created_at).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}
                                          </span>
                                        </div>
                                        <Markdown text={m.content} variant="light" />
                                        {m.sender_type === "ai" && (m.category || m.urgency || m.confidence !== null) && (
                                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                            {m.category && (
                                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                                                {m.category}
                                              </span>
                                            )}
                                            {m.urgency && (
                                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                                m.urgency === "high"
                                                  ? "bg-red-50 text-red-700"
                                                  : m.urgency === "medium"
                                                  ? "bg-amber-50 text-amber-700"
                                                  : "bg-emerald-50 text-emerald-700"
                                              }`}>
                                                {m.urgency}
                                              </span>
                                            )}
                                            {m.confidence !== null && (
                                              <span className="text-[10px] text-slate-500">
                                                {Math.round(m.confidence * 100)}%
                                              </span>
                                            )}
                                          </div>
                                        )}
                                        {m.draft_reply && (
                                          <div className="mt-2 pt-2 border-t border-slate-200">
                                            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 mb-1">
                                              Draft Reply (Admin Only)
                                            </p>
                                            <div className="italic">
                                              <Markdown text={m.draft_reply} variant="light" />
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}
              <Pagination
                page={chatPage}
                totalPages={chatTotalPages}
                total={chatTotal}
                limit={PAGE_SIZE}
                onPageChange={setChatPage}
                disabled={loadingChats}
                itemLabel="chat"
              />
            </div>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {confirmAction && modalCfg && ModalIcon && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
            onClick={() => !isProcessing && setConfirmAction(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 sm:p-6"
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
                  disabled={isProcessing}
                  className="px-4 h-10 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold rounded-lg transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isProcessing}
                  className={`px-4 h-10 flex items-center gap-1.5 text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed ${modalCfg.confirmClass}`}
                >
                  {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
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

function AnalyticsPanel({ data, loading }: { data: AnalyticsData | null; loading: boolean }) {
  const [selectedTrendDate, setSelectedTrendDate] = useState<string | null>(null);
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-16 flex flex-col items-center gap-3 text-slate-400 text-sm">
        <Loader2 className="w-8 h-8 animate-spin" />
        Memuat analytics...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-16 flex flex-col items-center gap-3 text-slate-400 text-sm">
        <AlertCircle className="w-8 h-8" />
        Belum ada data analytics.
      </div>
    );
  }

  const totalCategory = data.ai.by_category.reduce((sum, c) => sum + c.count, 0);
  const totalUrgency = data.ai.by_urgency.low + data.ai.by_urgency.medium + data.ai.by_urgency.high;
  const maxTrend = Math.max(
    1,
    ...data.daily_trend_last_30_days.map((d) => Math.max(d.conversations, d.messages)),
  );

  const urgencyRows: Array<{ key: "low" | "medium" | "high"; label: string; color: string; bg: string }> = [
    { key: "low",    label: "Low",    color: "bg-emerald-500", bg: "bg-emerald-50 text-emerald-700" },
    { key: "medium", label: "Medium", color: "bg-amber-500",   bg: "bg-amber-50 text-amber-700" },
    { key: "high",   label: "High",   color: "bg-red-500",     bg: "bg-red-50 text-red-700" },
  ];

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
        <MetricCard
          icon={<Users className="w-4 h-4 text-blue-600" />}
          label="Total Peserta"
          value={data.users.total}
          sub={`${data.users.active} aktif · ${data.users.inactive} nonaktif`}
          color="bg-blue-50 border-blue-100"
        />
        <MetricCard
          icon={<MessageSquare className="w-4 h-4 text-[#CC0000]" />}
          label="Total Chat"
          value={data.conversations.total}
          sub={`${data.conversations.new_today} hari ini · ${data.conversations.new_last_7_days} minggu ini`}
          color="bg-red-50 border-red-100"
        />
        <MetricCard
          icon={<Bot className="w-4 h-4 text-purple-600" />}
          label="Total Pesan"
          value={data.messages.total}
          sub={`${data.messages.by_sender.user} user · ${data.messages.by_sender.ai} AI`}
          color="bg-purple-50 border-purple-100"
        />
        <MetricCard
          icon={<Activity className="w-4 h-4 text-emerald-600" />}
          label="Confidence Rata-rata"
          value={data.ai.avg_confidence !== null ? `${Math.round(data.ai.avg_confidence * 100)}%` : "—"}
          sub={`${data.users.new_last_7_days} peserta baru 7 hari`}
          color="bg-emerald-50 border-emerald-100"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-[#CC0000]" />
            <h3 className="text-slate-800 font-semibold text-sm">Distribusi Kategori AI</h3>
          </div>
          {data.ai.by_category.length === 0 ? (
            <p className="text-slate-400 text-sm">Belum ada data kategori.</p>
          ) : (
            <div className="space-y-2.5">
              {data.ai.by_category.map((c) => {
                const pct = totalCategory > 0 ? (c.count / totalCategory) * 100 : 0;
                return (
                  <div key={c.category}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-700 font-medium truncate">{c.category}</span>
                      <span className="text-slate-500">{c.count} · {pct.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#CC0000] to-[#4B1E6B] rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-amber-500" />
            <h3 className="text-slate-800 font-semibold text-sm">Distribusi Urgensi</h3>
          </div>
          {totalUrgency === 0 ? (
            <p className="text-slate-400 text-sm">Belum ada data urgensi.</p>
          ) : (
            <div className="space-y-2.5">
              {urgencyRows.map((r) => {
                const count = data.ai.by_urgency[r.key];
                const pct = totalUrgency > 0 ? (count / totalUrgency) * 100 : 0;
                return (
                  <div key={r.key}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${r.bg}`}>{r.label}</span>
                      <span className="text-slate-500">{count} · {pct.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${r.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
        <div className="flex items-start sm:items-center justify-between mb-4 gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <h3 className="text-slate-800 font-semibold text-sm">Trend 30 Hari Terakhir</h3>
          </div>
          <div className="flex items-center gap-3 text-[11px] sm:text-xs">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#CC0000]" /> Chat
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-sm bg-purple-400" /> Pesan
            </span>
          </div>
        </div>
        {data.daily_trend_last_30_days.length === 0 ? (
          <p className="text-slate-400 text-sm">Belum ada data trend.</p>
        ) : (
          <>
            <div className="overflow-x-auto -mx-1 px-1">
              <div className="flex items-end gap-0.5 sm:gap-1 h-40 min-w-[480px]">
                {data.daily_trend_last_30_days.map((d) => {
                  const convPct = (d.conversations / maxTrend) * 100;
                  const msgPct = (d.messages / maxTrend) * 100;
                  const isSelected = selectedTrendDate === d.date;
                  const isEmpty = d.conversations === 0 && d.messages === 0;
                  return (
                    <button
                      type="button"
                      key={d.date}
                      onClick={() => setSelectedTrendDate(isSelected ? null : d.date)}
                      className={`flex-1 h-full flex items-end gap-0.5 relative rounded-sm transition-all ${
                        isSelected
                          ? "bg-slate-100 ring-1 ring-[#CC0000]"
                          : "hover:bg-slate-50"
                      }`}
                      title={`${d.date} · ${d.conversations} chat · ${d.messages} pesan`}
                    >
                      <div
                        className={`flex-1 rounded-sm min-h-[1px] transition-all ${
                          isEmpty && !isSelected ? "bg-[#CC0000]/30" : "bg-[#CC0000]"
                        }`}
                        style={{ height: `${convPct}%` }}
                      />
                      <div
                        className={`flex-1 rounded-sm min-h-[1px] transition-all ${
                          isEmpty && !isSelected ? "bg-purple-300" : "bg-purple-400"
                        }`}
                        style={{ height: `${msgPct}%` }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
            <TrendDetailCard
              data={data.daily_trend_last_30_days}
              selectedDate={selectedTrendDate}
              onClose={() => setSelectedTrendDate(null)}
            />
          </>
        )}
        <p className="text-slate-400 text-[10px] mt-3 text-right">
          Data per: {new Date(data.generated_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
        </p>
      </div>
    </div>
  );
}

function TrendDetailCard({
  data,
  selectedDate,
  onClose,
}: {
  data: Array<{ date: string; conversations: number; messages: number }>;
  selectedDate: string | null;
  onClose: () => void;
}) {
  if (!selectedDate) {
    return (
      <p className="text-slate-400 text-[11px] mt-3 text-center italic">
        Klik bar untuk lihat detail per hari
      </p>
    );
  }

  const entry = data.find((d) => d.date === selectedDate);
  if (!entry) return null;

  const formatted = new Date(selectedDate).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold mb-0.5">Detail</p>
        <p className="text-slate-800 text-sm font-semibold truncate">{formatted}</p>
        <div className="flex items-center gap-4 mt-1.5 text-xs">
          <span className="flex items-center gap-1.5 text-slate-700">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#CC0000]" />
            <span className="font-semibold">{entry.conversations}</span> chat
          </span>
          <span className="flex items-center gap-1.5 text-slate-700">
            <span className="w-2.5 h-2.5 rounded-sm bg-purple-400" />
            <span className="font-semibold">{entry.messages}</span> pesan
          </span>
        </div>
      </div>
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-slate-700 text-xs font-medium px-2 py-1 rounded-lg hover:bg-slate-100 transition-all flex-shrink-0"
      >
        Tutup
      </button>
    </div>
  );
}

function MetricCard({ icon, label, value, sub, color }: {
  icon: ReactNode;
  label: string;
  value: string | number;
  sub: string;
  color: string;
}) {
  return (
    <div className={`rounded-2xl border p-3 sm:p-4 ${color}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center flex-shrink-0">{icon}</div>
        <p className="text-slate-700 text-[11px] sm:text-xs font-semibold truncate">{label}</p>
      </div>
      <p className="text-slate-900 text-xl sm:text-2xl font-bold">{value}</p>
      <p className="text-slate-500 text-[10px] sm:text-[11px] mt-0.5 leading-snug">{sub}</p>
    </div>
  );
}
