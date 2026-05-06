import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Bot, Send, User, Sparkles, Clock, BookOpen,
  RefreshCw, Copy, ThumbsUp, ThumbsDown, Zap, Shield,
  ChevronRight, FileText, AlertTriangle, CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext";

// ─── Types ─────────────────────────────────────────────────────────────────
// output model nanti harusnya match sama ini
// UrgencyLevel: low | medium | high (sesuai yang dilatih di dataset sintetis)
type UrgencyLevel = "low" | "medium" | "high";
type CategoryType = "Jadwal" | "Materi" | "Teknis" | "Tugas" | "Umum" | "Akun";

// ini harus sinkron sama format response dari express backend
// kalau BE ngerubah field, FE ikut update juga
interface ApiResponse {
  answer: string;
  category: CategoryType;
  urgency: UrgencyLevel;
  confidence: number; // 0-1
  draft_reply?: string; // cuma ada kalau role fasilitator
  sources?: string[]; // dari RAG, dokumen mana yang kepake
}

interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
  timestamp: Date;
  // field tambahan khusus buat pesan bot
  category?: CategoryType;
  urgency?: UrgencyLevel;
  confidence?: number;
  draftReply?: string;
  sources?: string[];
}

// ─── Config ────────────────────────────────────────────────────────────────
// ganti ke production URL sebelum demo ke penguji!
// jangan lupa update .env juga
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

// key harus sama persis sama History.tsx
// kalau beda nanti data ga kebaca di halaman riwayat
const HISTORY_KEY = "cc_chat_history";

interface HistoryItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  urgency: "low" | "medium" | "high";
  timestamp: string;
}

// simpan ke localStorage setiap kali ada response dari bot
// max 100 item — kalau lebih, yang paling lama ikepotong
function saveToHistory(question: string, res: ApiResponse) {
  try {
    const prev: HistoryItem[] = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
    const item: HistoryItem = {
      id: `hist_${Date.now()}`,
      question,
      answer: res.answer,
      category: res.category,
      urgency: res.urgency,
      timestamp: new Date().toISOString(),
    };
    const updated = [item, ...prev].slice(0, 100);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // storage penuh atau incognito mode — gapapa, skip aja
    // jangan sampe crash hanya karena ini
  }
}

// ─── Styling config per urgency & kategori ─────────────────────────────────
const urgencyConfig: Record<UrgencyLevel, { label: string; pill: string; dot: string; badge: string }> = {
  low: {
    label: "Low",
    dot: "bg-emerald-500",
    pill: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  medium: {
    label: "Medium",
    dot: "bg-amber-400",
    pill: "bg-amber-500/10 border-amber-500/30 text-yellow-400",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
  },
  high: {
    label: "High",
    dot: "bg-red-500",
    pill: "bg-red-500/10 border-red-500/30 text-red-400",
    badge: "bg-red-50 text-red-700 border-red-200",
  },
};

const categoryConfig: Record<CategoryType, { emoji: string; pill: string }> = {
  Jadwal: { emoji: "📅", pill: "bg-blue-500/10 border-blue-500/30 text-blue-400" },
  Materi: { emoji: "📚", pill: "bg-purple-500/10 border-purple-500/30 text-[#C084FC]" },
  Teknis: { emoji: "⚙️", pill: "bg-orange-500/10 border-orange-500/30 text-orange-400" },
  Tugas:  { emoji: "📝", pill: "bg-[#CC0000]/10 border-[#CC0000]/30 text-[#FF4444]" },
  Umum:   { emoji: "💬", pill: "bg-slate-500/10 border-slate-500/30 text-slate-400" },
  Akun:   { emoji: "👤", pill: "bg-teal-500/10 border-teal-500/30 text-teal-400" },
};

// pertanyaan quick-pick di halaman kosong
// TODO: ambil ini dari backend nanti biar bisa diupdate tanpa deploy ulang
const suggestions = [
  { text: "Kapan deadline submission capstone?", cat: "Jadwal" },
  { text: "Cara submit project ke GitHub?", cat: "Teknis" },
  { text: "Kriteria penilaian capstone project?", cat: "Tugas" },
  { text: "Error saat training TensorFlow?", cat: "Teknis" },
  { text: "Boleh pakai API GPT untuk fitur utama?", cat: "Tugas" },
  { text: "Cara deploy ke Google Cloud Platform?", cat: "Teknis" },
];

// ─── Mock data (demo/offline mode) ─────────────────────────────────────────
// dipake waktu backend belum nyala atau lagi dev offline
// isi disesuaikan sama FAQ dan project plan CC26-PSU096
// nanti hapus/komentarin waktu BE udah stable
const MOCK: { q: string; res: ApiResponse }[] = [
  {
    q: "deadline",
    res: {
      answer: "📅 **Deadline Capstone Project** adalah **5 Juni 2026**.\n\nTimeline:\n- **24 Apr**: Sprint pertama\n- **4 Mei**: Fase pengembangan\n- **25 Mei**: Integrasi & testing\n- **5 Jun**: Finalisasi & submit\n\nPastikan semua deliverable lengkap: Model AI, REST API, Live URL, Dashboard Streamlit, dan Dokumentasi.",
      category: "Jadwal",
      urgency: "low",
      confidence: 0.95,
      sources: ["Gantt Chart CC26-PSU096"],
      draft_reply: "Halo! Deadline submission capstone project adalah 5 Juni 2026. Pastikan semua deliverable (Model AI, REST API, Live URL, Dashboard Streamlit, dan Dokumentasi) sudah lengkap sebelum tanggal tersebut. Semangat! 💪",
    },
  },
  {
    q: "github",
    res: {
      answer: "🔧 **Cara Submit Project ke GitHub:**\n\n1. **Fork** repository utama tim\n2. **Clone**: `git clone <repo-url>`\n3. **Branch baru**: `git checkout -b feature/nama-fitur`\n4. **Commit**: `git commit -m 'feat: deskripsi'`\n5. **Push**: `git push origin feature/nama-fitur`\n6. **Pull Request** ke branch main",
      category: "Teknis",
      urgency: "low",
      confidence: 0.91,
      sources: ["Panduan GitHub Tim"],
      draft_reply: "Halo! Untuk submit project ke GitHub, ikuti alur berikut: fork repo → clone → buat branch baru → commit dengan konvensi tim → push → buat Pull Request. Jangan lupa minta review dari rekan tim sebelum merge ya!",
    },
  },
  {
    q: "kriteria",
    res: {
      answer: "📋 **Kriteria Penilaian Capstone:**\n\n**Main Quest (Wajib):**\n- ✅ Model AI mandiri dengan TensorFlow\n- ✅ REST API terintegrasi\n- ✅ Live URL Aplikasi Web\n- ✅ Dokumentasi lengkap\n\n**Side Quest (Bonus):**\n- 🌟 Akurasi model > 85%\n- 🌟 Dashboard Streamlit\n- 🌟 Fitur Generative AI\n\n⚠️ API GPT/Gemini untuk fitur utama = **pelanggaran Critical**!",
      category: "Tugas",
      urgency: "medium",
      confidence: 0.93,
      sources: ["Rubrik Penilaian Capstone"],
      draft_reply: "Halo! Penilaian capstone dibagi menjadi Main Quest (wajib) dan Side Quest (bonus). Main Quest meliputi: model AI mandiri TensorFlow, REST API, Live URL, dan Dokumentasi. Ingat, menggunakan API GPT/Gemini untuk fitur utama adalah pelanggaran Critical. Side Quest mencakup akurasi >85%, Streamlit, dan Generative AI.",
    },
  },
  {
    q: "tensorflow",
    res: {
      answer: "⚙️ **Error Training TensorFlow — Troubleshooting:**\n\n1. Cek versi: `pip show tensorflow`\n2. Pastikan Python 3.8-3.11 & TF 2.x\n3. Baca error message lengkap\n\n**Error umum:**\n- `Shape mismatch` → cek dimensi input\n- `OOM` → kurangi batch_size\n- `NaN loss` → cek learning rate\n- `Import error` → `pip install tensorflow==2.15`\n\nMasih error? Screenshot log dan konsultasikan ke fasilitator!",
      category: "Teknis",
      urgency: "high",
      confidence: 0.88,
      sources: ["Dokumentasi TensorFlow"],
      draft_reply: "Halo! Untuk error TensorFlow, coba langkah berikut: 1) cek versi dengan pip show tensorflow, 2) pastikan Python 3.8-3.11 dan TF 2.x, 3) baca error message dengan teliti. Error umum: shape mismatch → cek dimensi, OOM → kurangi batch_size, NaN loss → turunkan learning rate. Jika masih error, kirim screenshot log-nya ya!",
    },
  },
  {
    q: "gpt",
    res: {
      answer: "⚠️ **DILARANG — Pelanggaran Critical!**\n\nAPI GPT, Gemini, atau model AI pihak ketiga untuk **fitur utama** dapat menyebabkan **ketidaklulusan**.\n\n✅ **Boleh:**\n- TensorFlow Functional API / Subclassing (wajib)\n- API Generative AI sebagai fitur **pendukung** saja\n\n❌ **Dilarang:**\n- GPT/Gemini sebagai core model\n- Classifier utama dari API eksternal",
      category: "Tugas",
      urgency: "high",
      confidence: 0.97,
      sources: ["Aturan Main Quest"],
      draft_reply: "Halo! Penggunaan API GPT atau Gemini untuk fitur UTAMA adalah pelanggaran Critical yang bisa menyebabkan ketidaklulusan. Model wajib dibangun sendiri menggunakan TensorFlow. API Generative AI hanya boleh sebagai fitur pendukung (bukan core model). Harap perhatikan aturan ini dengan serius ya!",
    },
  },
  {
    q: "deploy",
    res: {
      answer: "☁️ **Deploy ke Google Cloud Platform:**\n\n1. Buat project di GCP Console\n2. Enable Cloud Run & Artifact Registry\n3. Containerize dengan Dockerfile\n4. Build: `gcloud builds submit --tag gcr.io/PROJECT-ID/app`\n5. Deploy: `gcloud run deploy --platform managed`\n\n**Alternatif:** Railway atau Render — connect GitHub & auto-deploy 🚀",
      category: "Teknis",
      urgency: "low",
      confidence: 0.86,
      sources: ["GCP Documentation", "Panduan Deployment Tim"],
      draft_reply: "Halo! Untuk deployment ke GCP: buat project → enable Cloud Run → containerize dengan Docker → build image → deploy via gcloud run. Alternatif yang lebih mudah: Railway atau Render dengan auto-deploy dari GitHub. Pastikan dokumentasikan langkah deployment agar bisa direplikasi tim!",
    },
  },
];

// cari response mock berdasarkan keyword — cukup includes, ga perlu exact match
function getMock(input: string): ApiResponse {
  const lower = input.toLowerCase();
  for (const item of MOCK) {
    if (lower.includes(item.q)) return item.res;
  }

  // sapaan — return welcome message
  if (/halo|hai|hello|hi/.test(lower)) {
    return {
      answer: "Halo! 👋 Saya **Coding Camp Copilot**, asisten AI untuk peserta Coding Camp 2026.\n\nSaya bisa membantu:\n- 📅 Jadwal & deadline\n- 📚 Materi pembelajaran\n- ⚙️ Masalah teknis\n- 📝 Tugas & submission\n- 👤 Akun & platform\n\nSilakan tanyakan apa saja! 😊",
      category: "Umum",
      urgency: "low",
      confidence: 1,
      draft_reply: "Halo! Selamat datang di Coding Camp 2026. Ada yang bisa saya bantu?",
    };
  }

  // default — ga ketemu di mock
  // confidence rendah biar ketauan ini fallback
  return {
    answer: "Maaf, saya belum punya informasi spesifik untuk pertanyaan tersebut. Silakan hubungi fasilitator atau cek dokumentasi di LMS.",
    category: "Umum",
    urgency: "medium",
    confidence: 0.4,
    draft_reply: "Halo! Untuk pertanyaan ini, kami sarankan untuk menghubungi fasilitator langsung atau mengecek dokumentasi resmi di platform LMS Coding Camp.",
  };
}

// ─── Markdown renderer mini ─────────────────────────────────────────────────
// render markdown sederhana: bold, bullet, numbered list
// sengaja ga pakai library biar bundle kecil — react-markdown itu gede banget
// cukup support format yang dipakai di MOCK dan response model kita
function Markdown({ text }: { text: string }) {
  return (
    <div className="space-y-0.5">
      {text.split("\n").map((line, i) => {
        // heading sederhana: **teks**
        if (line.startsWith("**") && line.endsWith("**"))
          return <p key={i} className="font-semibold text-white mt-3 mb-0.5">{line.slice(2, -2)}</p>;

        // numbered list
        if (line.match(/^\d+\./)) {
          const parts = line.split(/\*\*(.*?)\*\*/g);
          return (
            <p key={i} className="ml-4 text-slate-300 text-sm">
              {parts.map((p, j) => j % 2 === 1 ? <strong key={j} className="text-white">{p}</strong> : p)}
            </p>
          );
        }

        // bullet list
        if (line.startsWith("- ")) {
          const inner = line.slice(2).split(/\*\*(.*?)\*\*/g);
          return (
            <p key={i} className="ml-4 flex gap-2 text-slate-300 text-sm">
              <span className="text-[#FF4444] flex-shrink-0">•</span>
              <span>{inner.map((p, j) => j % 2 === 1 ? <strong key={j} className="text-white">{p}</strong> : p)}</span>
            </p>
          );
        }

        if (line.trim() === "") return <div key={i} className="h-1" />;

        // paragraf biasa — inline bold support
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <p key={i} className="text-slate-300 text-sm leading-relaxed">
            {parts.map((p, j) => j % 2 === 1 ? <strong key={j} className="text-white">{p}</strong> : p)}
          </p>
        );
      })}
    </div>
  );
}

// ─── Draft Reply Card ──────────────────────────────────────────────────────
// khusus fasilitator — kartu draft balasan yang bisa langsung disalin
function DraftReplyCard({ draft, urgency }: { draft: string; urgency: UrgencyLevel }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const uc = urgencyConfig[urgency];

  const copy = () => {
    navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-2 rounded-xl border border-[#CC0000]/30 bg-[#1A0A2E]/40 overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[#CC0000]/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-[#FF4444] flex-shrink-0" />
          <span className="text-[#FF6666] text-xs font-semibold">Draft Reply untuk Fasilitator</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${uc.pill}`}>
            {uc.label}
          </span>
        </div>
        <ChevronRight className={`w-3.5 h-3.5 text-[#FF4444] transition-transform ${expanded ? "rotate-90" : ""}`} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-3 pb-3 border-t border-[#CC0000]/20 pt-2.5">
              <p className="text-slate-300 text-xs leading-relaxed mb-3 bg-[#141018]/50 rounded-lg p-2.5 border border-[#3D2D4D]/50">
                {draft}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={copy}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#CC0000]/80 hover:bg-[#CC0000] text-white text-xs rounded-lg transition-all font-medium"
                >
                  {copied ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? "Tersalin!" : "Salin Draft"}
                </button>
                <p className="text-slate-500 text-[10px]">Untuk digunakan atau dimodifikasi fasilitator</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// icon brain custom — belum ada di lucide versi yang kita pakai
// nanti kalau lucide update bisa dihapus dan pakai yang official
function Brain({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
    </svg>
  );
}

// counter untuk generate ID message yang unik
// Date.now() saja ga cukup kalau response masuk cepet banget
let _msgSeq = 0;
function nextId() {
  return `msg_${Date.now()}_${++_msgSeq}`;
}

// ─── Main Component ─────────────────────────────────────────────────────────
export function Chat() {
  const { user } = useAuth();
  const isFasilitator = user?.role === "fasilitator";

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // status koneksi ke API backend
  // unknown = belum dicek, online = bisa, offline = fallback mock
  const [apiStatus, setApiStatus] = useState<"unknown" | "online" | "offline">("unknown");

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // health check waktu komponen mount
  // timeout 3 detik — kalau ga respon dianggap offline
  useEffect(() => {
    fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) })
      .then(r => setApiStatus(r.ok ? "online" : "offline"))
      .catch(() => setApiStatus("offline"));
  }, []);

  // scroll ke bawah otomatis setiap ada pesan baru
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // auto-resize textarea, max 6 baris
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 144)}px`;
  }, [input]);

  // panggil API atau fallback ke mock
  // useCallback supaya ga bikin re-render berlebihan di effect
  const callAPI = useCallback(async (question: string): Promise<ApiResponse> => {
    if (apiStatus === "offline") return getMock(question);

    try {
      const res = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
        signal: AbortSignal.timeout(8000), // 8 detik cukup buat inference TF model
      });

      if (!res.ok) throw new Error("API error " + res.status);

      const data = await res.json();
      setApiStatus("online");
      return data as ApiResponse;
    } catch (err) {
      // console.log("API gagal, pakai mock:", err); // <- uncomment kalau debug
      setApiStatus("offline");
      return getMock(question);
    }
  }, [apiStatus]);

  const sendMessage = async (text?: string) => {
    const msgText = (text || input).trim();
    // guard — jangan kirim kalau kosong atau masih nunggu response sebelumnya
    if (!msgText || isTyping) return;

    setMessages(p => [...p, {
      id: nextId(),
      role: "user",
      content: msgText,
      timestamp: new Date(),
    }]);
    setInput("");
    setShowSuggestions(false);
    setIsTyping(true);

    try {
      const res = await callAPI(msgText);
      saveToHistory(msgText, res);

      setMessages(p => [...p, {
        id: nextId(),
        role: "bot",
        content: res.answer,
        timestamp: new Date(),
        category: res.category,
        urgency: res.urgency,
        confidence: res.confidence,
        draftReply: res.draft_reply,
        sources: res.sources,
      }]);
    } catch (err) {
      // harusnya ga nyampe sini karena callAPI udah handle error internal
      // tapi just in case
      console.error("Unexpected error di sendMessage:", err);
    } finally {
      setIsTyping(false);
    }
  };

  // Enter kirim, Shift+Enter newline
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([]);
    setShowSuggestions(true);
    // TODO: tanya user konfirmasi dulu ga ya? nanti dipikirin
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#0D0D0D] overflow-hidden">

      {/* Sidebar — desktop only */}
      <aside className="hidden lg:flex flex-col w-64 xl:w-72 border-r border-[#2D1F3D]/80 bg-[#141018] flex-shrink-0">

        {/* Bot identity + status API */}
        <div className="p-5 border-b border-[#2D1F3D]">
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-br from-[#CC0000]/10 to-[#4B1E6B]/20 border border-[#CC0000]/20">
            <div className="relative">
              <div className="w-11 h-11 bg-gradient-to-br from-[#CC0000] to-[#8B0000] rounded-xl flex items-center justify-center shadow-lg shadow-[#CC0000]/30">
                <Bot style={{ width: "22px", height: "22px" }} className="text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Copilot AI</p>
              <p className="text-emerald-400 text-xs">● Online · Siap membantu</p>
            </div>
          </div>

          {/* status koneksi backend */}
          <div className={`mt-2.5 flex items-center gap-2 px-3 py-2 rounded-xl text-xs border ${
            apiStatus === "online"  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
            apiStatus === "offline" ? "bg-amber-500/10 border-amber-500/20 text-yellow-400" :
                                     "bg-slate-700/30 border-[#3D2D4D] text-slate-500"
          }`}>
            {apiStatus === "online"  && <><CheckCircle2 className="w-3 h-3" /> API Model — Terhubung</>}
            {apiStatus === "offline" && <><AlertTriangle className="w-3 h-3" /> API offline — Mode demo</>}
            {apiStatus === "unknown" && <><div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> Cek koneksi API...</>}
          </div>
        </div>

        {/* Info user */}
        {user && (
          <div className="px-5 py-3 border-b border-[#2D1F3D]">
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">Login sebagai</p>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center text-white text-xs font-bold border border-slate-600">
                {user.name.charAt(0)}
              </div>
              <div>
                <p className="text-white text-xs font-medium">{user.name}</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium capitalize ${
                  user.role === "fasilitator"
                    ? "bg-amber-500/10 border-amber-500/30 text-yellow-400"
                    : "bg-blue-500/10 border-blue-500/30 text-blue-400"
                }`}>{user.role}</span>
              </div>
            </div>
            {isFasilitator && (
              <p className="mt-2 text-[10px] text-yellow-400/80 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2 py-1.5 leading-relaxed">
                ✨ Mode fasilitator: draft reply otomatis tersedia di setiap respons AI
              </p>
            )}
          </div>
        )}

        {/* Info teknologi */}
        <div className="p-5 border-b border-[#2D1F3D] space-y-2.5">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-3">Teknologi AI</p>
          {[
            { icon: Brain,    label: "NLP TensorFlow Custom",  color: "text-[#FF4444]"  },
            { icon: BookOpen, label: "RAG Knowledge Base",     color: "text-[#C084FC]"  },
            { icon: Zap,      label: "Akurasi Target >85%",    color: "text-yellow-400" },
            { icon: Shield,   label: "Privasi Data Terjaga",   color: "text-emerald-400"},
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex items-center gap-2.5 text-xs text-slate-400 hover:text-slate-200 transition-colors">
              <Icon className={`w-3.5 h-3.5 ${color} flex-shrink-0`} />
              {label}
            </div>
          ))}
        </div>

        {/* Legend urgency */}
        <div className="p-5 border-b border-[#2D1F3D]">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-3">Tingkat Urgensi</p>
          <div className="space-y-2">
            {(Object.entries(urgencyConfig) as [UrgencyLevel, typeof urgencyConfig.low][]).map(([k, v]) => (
              <div key={k} className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border ${v.pill}`}>
                <span className={`w-2 h-2 rounded-full ${v.dot} flex-shrink-0`} />
                {v.label} Urgency
              </div>
            ))}
          </div>
        </div>

        {/* Shortcut kategori */}
        <div className="p-5 flex-1 overflow-y-auto">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-3">Tanya per Kategori</p>
          <div className="flex flex-wrap gap-1.5">
            {(Object.entries(categoryConfig) as [CategoryType, typeof categoryConfig.Umum][]).map(([k, v]) => (
              <button
                key={k}
                onClick={() => {
                  setInput(`Pertanyaan tentang ${k}: `);
                  inputRef.current?.focus();
                }}
                className="text-xs px-2.5 py-1 rounded-full bg-[#1E1428] border border-[#3D2D4D] text-slate-400 hover:border-[#CC0000]/60 hover:text-white transition-all"
              >
                {v.emoji} {k}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-[#2D1F3D]">
          <button
            onClick={clearChat}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#3D2D4D] text-slate-500 hover:border-red-500/40 hover:text-red-400 transition-all text-xs font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Bersihkan Chat
          </button>
        </div>
      </aside>

      {/* ── Area chat utama ── */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0">

        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#2D1F3D] bg-[#141018]/70 backdrop-blur flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[#CC0000] to-[#8B0000] rounded-xl flex items-center justify-center shadow-md">
              <Bot style={{ width: "18px", height: "18px" }} className="text-white" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Coding Camp Copilot</p>
              <p className="text-slate-500 text-xs">CC26-PSU096 · DBS Foundation 2026</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isFasilitator && (
              <span className="text-[10px] bg-amber-500/10 border border-amber-500/30 text-yellow-400 px-2 py-1 rounded-full font-medium">
                ✨ Mode Fasilitator
              </span>
            )}
            {/* clear chat hanya di mobile — di desktop ada di sidebar */}
            <button onClick={clearChat} className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-[#1E1428] transition-all">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth">
          <div className="max-w-3xl mx-auto w-full space-y-2">

            {/* Suggestions + welcome — muncul kalau belum ada pesan */}
            <AnimatePresence>
              {showSuggestions && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.35 }}
                  className="mb-8"
                >
                  <div className="text-center py-10">
                    <motion.div
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      className="w-20 h-20 bg-gradient-to-br from-[#CC0000] to-[#8B0000] rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-[#CC0000]/30"
                    >
                      <Sparkles className="w-10 h-10 text-white" />
                    </motion.div>
                    <h2 className="text-white text-2xl font-bold mb-2">
                      Selamat datang{user ? `, ${user.name.split(" ")[0]}` : ""}! 👋
                    </h2>
                    <p className="text-slate-400 text-sm max-w-sm mx-auto">
                      Tanyakan apa saja seputar Coding Camp 2026
                    </p>
                    {isFasilitator && (
                      <p className="mt-2 text-yellow-400 text-xs">
                        ✨ Draft reply otomatis tersedia di setiap jawaban
                      </p>
                    )}
                  </div>

                  <p className="text-slate-600 text-[11px] text-center mb-3 uppercase tracking-widest font-semibold">
                    Pertanyaan populer
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {suggestions.map((q) => (
                      <button
                        key={q.text}
                        onClick={() => sendMessage(q.text)}
                        className="group flex items-center gap-3 p-4 rounded-xl bg-[#1E1428]/50 border border-[#3D2D4D]/50 hover:border-[#CC0000]/50 hover:bg-[#1E1428] text-left transition-all duration-200"
                      >
                        <span className="text-lg flex-shrink-0">{categoryConfig[q.cat as CategoryType]?.emoji}</span>
                        <span className="text-slate-300 text-sm flex-1 group-hover:text-white transition-colors">{q.text}</span>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-[#FF4444] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Daftar pesan */}
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"} mb-4`}
                >
                  {msg.role === "bot" && (
                    <div className="w-8 h-8 bg-gradient-to-br from-[#CC0000] to-[#8B0000] rounded-xl flex items-center justify-center flex-shrink-0 mt-1 shadow-lg shadow-[#CC0000]/25">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}

                  <div className={`flex flex-col gap-2 max-w-[84%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    {msg.role === "user" ? (
                      <div className="px-4 py-3 rounded-2xl rounded-tr-sm bg-gradient-to-br from-[#CC0000] to-[#8B0000] text-white text-sm leading-relaxed shadow-lg shadow-[#CC0000]/20">
                        {msg.content}
                      </div>
                    ) : (
                      <div className="w-full px-4 py-3.5 rounded-2xl rounded-tl-sm bg-[#1E1428] border border-[#3D2D4D]/50 shadow-sm">
                        <Markdown text={msg.content} />
                      </div>
                    )}

                    {/* Badge kategori, urgency, confidence */}
                    {msg.role === "bot" && msg.category && msg.urgency && (
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${categoryConfig[msg.category].pill}`}>
                          {categoryConfig[msg.category].emoji} {msg.category}
                        </span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium flex items-center gap-1.5 ${urgencyConfig[msg.urgency].pill}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${urgencyConfig[msg.urgency].dot}`} />
                          {urgencyConfig[msg.urgency].label} Urgency
                        </span>
                        {msg.confidence !== undefined && (
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <span className="w-1 h-1 bg-slate-600 rounded-full" />
                            Konfidensial {Math.round(msg.confidence * 100)}%
                          </span>
                        )}
                        {/* sumber RAG yang kepake */}
                        {msg.sources?.map(s => (
                          <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-[#1E1428] border border-[#3D2D4D] text-slate-500 flex items-center gap-1">
                            <BookOpen className="w-2.5 h-2.5" /> {s}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Draft reply — hanya untuk fasilitator */}
                    {msg.role === "bot" && msg.draftReply && isFasilitator && (
                      <div className="w-full">
                        <DraftReplyCard draft={msg.draftReply} urgency={msg.urgency ?? "low"} />
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      {msg.role === "bot" && (
                        <>
                          <button
                            onClick={() => copyText(msg.id, msg.content)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-[#1E1428] transition-all"
                            title="Salin jawaban"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          {copiedId === msg.id && (
                            <span className="text-[11px] text-emerald-400 font-medium">✓ Disalin!</span>
                          )}
                          {/* thumbs up/down — belum connect ke BE, perlu endpoint feedback */}
                          {/* TODO: implementasi feedback endpoint di sprint berikutnya */}
                          <button className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-400 hover:bg-[#1E1428] transition-all" title="Jawaban membantu">
                            <ThumbsUp className="w-3 h-3" />
                          </button>
                          <button className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-[#1E1428] transition-all" title="Jawaban kurang tepat">
                            <ThumbsDown className="w-3 h-3" />
                          </button>
                        </>
                      )}
                      <span className="text-[11px] text-slate-600 flex items-center gap-1 ml-1">
                        <Clock className="w-2.5 h-2.5" />
                        {msg.timestamp.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>

                  {msg.role === "user" && (
                    <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 border border-slate-600">
                      <User className="w-4 h-4 text-slate-300" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing indicator — tiga dot bouncing */}
            <AnimatePresence>
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex gap-3 mb-4"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-[#CC0000] to-[#8B0000] rounded-xl flex items-center justify-center flex-shrink-0 mt-1 shadow-lg">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="px-4 py-3.5 rounded-2xl rounded-tl-sm bg-[#1E1428] border border-[#3D2D4D]/50">
                    <div className="flex items-center gap-1.5">
                      {[0, 1, 2].map(i => (
                        <motion.span
                          key={i}
                          className="w-2 h-2 bg-[#FF4444] rounded-full"
                          animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.18 }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* anchor scroll */}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* ── Input area ── */}
        <div className="flex-shrink-0 px-4 py-4 border-t border-[#2D1F3D] bg-[#141018]/70 backdrop-blur">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-3 bg-[#1E1428] border border-[#3D2D4D]/80 rounded-2xl px-4 py-3 focus-within:border-[#CC0000]/70 focus-within:ring-2 focus-within:ring-[#CC0000]/15 transition-all duration-200 shadow-lg">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tanya seputar Coding Camp 2026..."
                className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm outline-none resize-none max-h-36 min-h-[24px] leading-relaxed overflow-y-auto"
                rows={1}
                style={{ height: "24px" }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isTyping}
                className="w-9 h-9 bg-gradient-to-br from-[#CC0000] to-[#8B0000] text-white rounded-xl flex items-center justify-center hover:shadow-lg hover:shadow-[#CC0000]/30 active:scale-95 transition-all disabled:opacity-25 disabled:cursor-not-allowed flex-shrink-0 group"
              >
                <Send className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-150" />
              </button>
            </div>
            <p className="text-slate-700 text-[11px] text-center mt-2">
              {apiStatus === "offline" ? "⚠️ Mode demo — API model belum terhubung · " : ""}
              Copilot AI dapat membuat kesalahan · Verifikasi ke fasilitator ·{" "}
              <kbd className="bg-[#1E1428] px-1 rounded text-slate-500">Enter</kbd> kirim ·{" "}
              <kbd className="bg-[#1E1428] px-1 rounded text-slate-500">Shift+Enter</kbd> baris baru
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
