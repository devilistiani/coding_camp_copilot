import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Clock, MessageSquare, Trash2, Search, Bot,
  ChevronRight, AlertCircle, Loader2, ArrowRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Markdown } from "../components/Markdown";
import { Pagination } from "../components/Pagination";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5001/api/v1";
const PAGE_SIZE = 10;

interface ConversationItem {
  id: string;
  title: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface MessageDetail {
  id: string;
  sender_type: "user" | "ai";
  content: string;
  category: string | null;
  urgency: "low" | "medium" | "high" | null;
  confidence: number | null;
  created_at: string;
}

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

export function History() {
  const { user, authFetch } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailCache, setDetailCache] = useState<Record<string, MessageDetail[]>>({});
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const fetchConversations = useCallback(async (currentPage: number, q: string) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(PAGE_SIZE),
        mine: "true",
      });
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
        created_at: string;
        updated_at: string;
      }>;
      const pagination = json?.data?.pagination as { total: number; total_pages: number } | undefined;
      setConversations(
        items.map((c) => ({
          id: c.id,
          title: c.title ?? "(Tanpa judul)",
          messageCount: c.message_count,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
        })),
      );
      setTotal(pagination?.total ?? 0);
      setTotalPages(pagination?.total_pages ?? 1);
      setExpandedId(null);
    } catch {
      setError("Server tidak dapat dijangkau. Coba lagi nanti.");
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchConversations(page, debouncedSearch);
  }, [fetchConversations, page, debouncedSearch]);

  const handleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (detailCache[id]) return;
    setLoadingDetail(id);
    try {
      const res = await authFetch(`${API_BASE}/conversations/${id}`, {
        signal: AbortSignal.timeout(10000),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.error?.message ?? "Gagal memuat detail chat");
        return;
      }
      const messages = (json?.data?.messages ?? []) as MessageDetail[];
      setDetailCache((prev) => ({ ...prev, [id]: messages }));
    } catch {
      setError("Server tidak dapat dijangkau. Coba lagi nanti.");
    } finally {
      setLoadingDetail(null);
    }
  };

  const deleteConversation = async (id: string) => {
    setDeletingId(id);
    setError("");
    try {
      const res = await authFetch(`${API_BASE}/conversations/${id}`, {
        method: "DELETE",
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok && res.status !== 204) {
        const json = await res.json().catch(() => null);
        setError(json?.error?.message ?? "Gagal menghapus chat");
        return;
      }
      if (expandedId === id) setExpandedId(null);
      const isLastOnPage = conversations.length === 1 && page > 1;
      if (isLastOnPage) {
        setPage((p) => p - 1);
      } else {
        await fetchConversations(page, debouncedSearch);
      }
    } catch {
      setError("Server tidak dapat dijangkau. Coba lagi nanti.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <section className="bg-gradient-to-br from-[#0D0D0D] via-[#1A0A2E] to-[#0D0D0D] text-white py-12">
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

        <div className="relative mb-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan judul chat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30 focus:border-[#CC0000]/50 transition-all"
          />
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-slate-400 text-sm flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin" />
            Memuat riwayat...
          </div>
        ) : conversations.length === 0 && !debouncedSearch ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-600 font-medium mb-2">Belum ada riwayat chat</p>
            <p className="text-slate-400 text-sm mb-5">
              Mulai tanya ke Copilot — riwayat akan tersimpan otomatis di akun kamu.
            </p>
            <Link
              to="/chat"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#CC0000] text-white rounded-xl font-semibold text-sm hover:bg-[#8B0000] transition-all shadow-md"
            >
              <MessageSquare className="w-4 h-4" />
              Mulai Chat Sekarang
            </Link>
          </motion.div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>Tidak ada hasil untuk &quot;{debouncedSearch}&quot;</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {conversations.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-[#CC0000]/20 transition-colors"
              >
                <button
                  onClick={() => handleExpand(item.id)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-[#CC0000] to-[#8B0000] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 font-medium text-sm truncate">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {item.messageCount} pesan
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(item.updatedAt)}
                      </span>
                    </div>
                  </div>

                  <ChevronRight
                    className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
                      expandedId === item.id ? "rotate-90 text-[#CC0000]" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {expandedId === item.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-4 pb-4 pt-3 border-t border-slate-100 space-y-2">
                        {loadingDetail === item.id ? (
                          <div className="flex items-center justify-center gap-2 py-6 text-slate-400 text-sm">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Memuat percakapan...
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {(detailCache[item.id] ?? []).map((m) => (
                              <div
                                key={m.id}
                                className={`rounded-xl p-3 border ${
                                  m.sender_type === "user"
                                    ? "bg-[#CC0000]/5 border-[#CC0000]/20 ml-6"
                                    : "bg-slate-50 border-slate-200 mr-6"
                                }`}
                              >
                                <div className="text-[10px] font-semibold uppercase tracking-wider mb-1 text-slate-500">
                                  {m.sender_type === "user" ? "Kamu" : "Copilot AI"}
                                </div>
                                <Markdown text={m.content} variant="light" />
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 gap-2">
                          <button
                            onClick={() => navigate(`/chat?conversation=${item.id}`)}
                            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-gradient-to-r from-[#CC0000] to-[#8B0000] hover:from-[#8B0000] hover:to-[#CC0000] px-3 py-1.5 rounded-lg transition-all shadow-sm"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Lanjutkan Chat
                            <ArrowRight className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => deleteConversation(item.id)}
                            disabled={deletingId === item.id}
                            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {deletingId === item.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Trash2 className="w-3.5 h-3.5" />}
                            Hapus
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
            {totalPages > 1 && (
              <div className="bg-white rounded-2xl border border-slate-200 mt-3">
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  total={total}
                  limit={PAGE_SIZE}
                  onPageChange={setPage}
                  disabled={loading}
                  itemLabel="chat"
                />
              </div>
            )}
          </div>
        )}

        {total > 0 && totalPages <= 1 && (
          <p className="text-center text-slate-400 text-xs mt-6">
            {total} chat tersimpan di akun kamu
          </p>
        )}
      </div>
    </div>
  );
}
