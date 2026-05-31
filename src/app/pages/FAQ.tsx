import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, ChevronDown, BookOpen, MessageSquare, AlertTriangle, Shield } from "lucide-react";
import { Link } from "react-router";

const categories = ["Semua", "Jadwal", "Tugas", "Teknis", "Platform", "Akun"];

const faqs = [
  {
    category: "Jadwal",
    q: "Kapan deadline submission capstone project?",
    a: "Deadline submission capstone adalah 5 Juni 2026. Deliverable yang harus lengkap:\n1. Model AI dalam format .keras atau SavedModel\n2. REST API terintegrasi — ML API + Backend API\n3. Live URL Aplikasi Web\n4. Live URL Dashboard Streamlit (interaktif)\n5. Dokumentasi: Laporan Teknis DS (PDF), Project Brief, dan Slide Presentasi.\n\nPastikan semua sudah siap sebelum deadline!",
  },
  {
    category: "Jadwal",
    q: "Bagaimana jadwal sprint dan cara memantau progres tim?",
    a: "Tim menggunakan metode Scrum dengan sprint mingguan. Tools manajemen proyek menggunakan Trello untuk mengatur backlog, sprint, pembagian tugas, dan monitoring progres. Setiap sprint menyisakan buffer waktu 10-15% untuk penanganan issue tak terduga.\n\nJika sebuah isu tidak dapat diselesaikan dalam 1x24 jam, masalah dieskalasikan ke seluruh tim di standup berikutnya. Detail jadwal ada di Gantt Chart proyek.",
  },
  {
    category: "Tugas",
    q: "Apa saja kriteria penilaian capstone project?",
    a: "Penilaian dibagi dua bagian:\n\n**Main Quest (Wajib — harus dipenuhi):**\n• Model AI dibangun mandiri dengan TensorFlow Functional API atau Subclassing\n• REST API terintegrasi (ML + Backend)\n• Live URL Aplikasi Web\n• Dokumentasi lengkap (Laporan PDF, Project Brief, Slide)\n\n**Side Quest (Bonus nilai tambah):**\n• Akurasi model > 85% (diukur F1-score, precision, recall)\n• Dashboard Streamlit interaktif dengan Live URL terpisah\n• Fitur teks Generative AI sebagai pendukung (draft reply)\n\nPenting: API GPT/Gemini untuk fitur UTAMA = pelanggaran Critical!",
  },
  {
    category: "Tugas",
    q: "Apakah boleh menggunakan API GPT atau Gemini untuk model utama?",
    a: "TIDAK BOLEH. Ini adalah pelanggaran Critical yang dapat menyebabkan ketidaklulusan.\n\nYang WAJIB: membangun model Deep Learning secara mandiri menggunakan TensorFlow Functional API atau Subclassing. Tim AI Engineer berkomitmen melakukan code review berkala untuk memastikan tidak ada import model eksternal yang tidak diizinkan.\n\nYang BOLEH: API Generative AI hanya sebagai fitur PENDUKUNG (bukan model utama), contohnya untuk draft reply otomatis admin.\n\nRujukan: Risk Management Framework Project Plan CC26-PSU096 — Risiko Level Critical.",
  },
  {
    category: "Tugas",
    q: "Apa itu Side Quest dan bagaimana cara mencapainya?",
    a: "Side Quest adalah tantangan bonus yang memberikan nilai tambah di luar Main Quest:\n\n1. Akurasi model > 85%: Lakukan iterasi hyperparameter tuning sistematis. Pantau F1-score, precision, recall di setiap epoch. Gunakan A/B testing untuk membandingkan variasi arsitektur.\n\n2. Dashboard Streamlit: Buat dashboard interaktif (Live URL terpisah) untuk visualisasi data analitik — distribusi pertanyaan, tren urgensi, performa model.\n\n3. Generative AI pendukung: Integrasikan fitur draft reply otomatis menggunakan API Generative AI sebagai PENDUKUNG saja.\n\nPrioritaskan Main Quest terlebih dahulu, baru kerjakan Side Quest jika sprint utama sudah aman.",
  },
  {
    category: "Tugas",
    q: "Bagaimana cara menghindari data leakage saat training model?",
    a: "Sesuai Risk Management Framework proyek (risiko Level High):\n\n1. Pisahkan dataset secara ketat sejak awal — split train/validation/test sebelum apapun\n2. Gunakan pipeline preprocessing yang terisolasi per split\n3. Data sintetis dibuat SETELAH split agar tidak mencemari set evaluasi\n4. Validasi label secara manual oleh minimal 2 anggota tim sebelum training\n\nDataset yang digunakan: Dataset Sintetis (data dummy berdasarkan pola pertanyaan umum peserta) + Data FAQ Coding Camp + Dokumen Internal yang sudah diizinkan. Data percakapan asli yang mengandung informasi pribadi harus dianonimisasi.",
  },
  {
    category: "Teknis",
    q: "Cara submit project ke GitHub dengan benar?",
    a: "Alur Git yang disepakati tim:\n1. Fork repository utama tim di GitHub\n2. Clone ke lokal: git clone <repo-url>\n3. Buat branch baru: git checkout -b feature/nama-fitur\n4. Commit dengan konvensi: git commit -m 'feat: deskripsi singkat'\n5. Push: git push origin feature/nama-fitur\n6. Buat Pull Request ke branch main dan minta review rekan tim\n\nGunakan label Trello (blocker/bug/scope change) untuk setiap hambatan teknis agar bisa dilacak di akhir sprint.",
  },
  {
    category: "Teknis",
    q: "Error saat training TensorFlow, apa yang harus dilakukan?",
    a: "Langkah troubleshooting sistematis:\n\n1. Cek versi: pip show tensorflow — pastikan Python 3.8-3.11 dan TF 2.x\n2. Baca error message di terminal secara lengkap\n\nError umum dan solusinya:\n• Shape mismatch → periksa dimensi input dan output layer\n• OOM (Out of Memory) → kurangi batch_size\n• NaN loss → turunkan learning rate atau gunakan clipnorm\n• Import error → pip install tensorflow==2.15\n\nJika tidak teratasi dalam 1x24 jam → eskalasi ke seluruh tim di standup berikutnya (sesuai Rencana Kontingensi proyek). Screenshot error log dan bagikan ke tim.",
  },
  {
    category: "Teknis",
    q: "Bagaimana cara mengintegrasikan frontend ke API model AI?",
    a: "Sesuai Risk Management Framework (risiko Integrasi Level Medium):\n\n1. Definisikan kontrak API sejak awal — endpoint, format request/response JSON\n2. Uji endpoint menggunakan Postman sebelum dihubungkan ke frontend\n3. Sediakan mock API sementara agar pengembangan UI tidak terhambat\n\nFormat request API yang disepakati:\nPOST /predict\nBody: { 'question': 'teks pertanyaan' }\nResponse: { 'answer', 'category', 'urgency', 'confidence', 'draft_reply', 'sources' }\n\nVariabel VITE_API_URL di file .env menentukan URL backend yang digunakan.",
  },
  {
    category: "Teknis",
    q: "Platform cloud mana yang direkomendasikan untuk deployment?",
    a: "Sesuai Sumber Daya Proyek:\n\nPilihan utama: Google Cloud Platform (GCP) — Cloud Run untuk containerized deployment.\nAlternatif: Railway atau Render — lebih mudah, cukup connect GitHub repo dan auto-deploy.\n\nStrategi mitigasi risiko deployment (Level Medium):\n1. Uji deployment di environment staging sebelum production\n2. Siapkan alternatif platform jika satu platform gangguan\n3. Dokumentasikan langkah deployment agar bisa direplikasi tim lain\n\nUntuk model AI: gunakan format SavedModel atau .keras agar mudah di-serve via REST API.",
  },
  {
    category: "Platform",
    q: "Di mana sumber informasi resmi Coding Camp tersedia?",
    a: "Informasi resmi Coding Camp 2026 tersebar di beberapa platform — inilah justru masalah yang diselesaikan Copilot:\n\n• LMS Coding Camp: materi dan tugas resmi\n• Google Docs: Project Plan dan dokumen proyek\n• Spreadsheet (Gantt Chart): jadwal sprint dan timeline\n• Trello: backlog dan manajemen sprint tim\n• Discord/Slack tim: komunikasi harian\n\nCoding Camp Copilot mengintegrasikan semua sumber ini menjadi satu pintu layanan terpadu agar peserta tidak perlu mencari di berbagai tempat.",
  },
  {
    category: "Platform",
    q: "Apa perbedaan antara API ML dan API Backend Web dalam proyek ini?",
    a: "Proyek membutuhkan dua REST API terpisah yang terintegrasi:\n\n1. ML API (Python/FastAPI atau Flask):\n   • Endpoint /predict — terima pertanyaan, kembalikan klasifikasi + urgensi + jawaban\n   • Menjalankan model TensorFlow (.keras/SavedModel)\n   • Dikelola oleh AI Engineer\n\n2. Backend API (Express.js + Node.js):\n   • Auth endpoint (login/register) dengan JWT\n   • Histori percakapan (PostgreSQL)\n   • Knowledge base management\n   • Dikelola oleh Full-Stack Web Developer\n\nKeduanya harus terintegrasi dan bisa diuji via Postman.",
  },
  {
    category: "Akun",
    q: "Bagaimana cara login ke Coding Camp Copilot?",
    a: "Akses Copilot melalui Live URL yang sudah dideploy tim.\n\nUntuk demo lokal, gunakan kredensial berikut:\n• Peserta: peserta@codingcamp.id / copilot2026\n• Admin: admin@codingcamp.id / admin2026\n\nPerbedaan mode:\n• Peserta: dapat mengajukan pertanyaan dan menerima jawaban AI\n• Admin: fitur tambahan Draft Reply otomatis di setiap jawaban AI — bisa langsung disalin untuk membalas peserta\n\nSistem auth menggunakan JWT yang terhubung ke backend Express.js + PostgreSQL.",
  },
];

// Warna badge kategori — konsisten dark theme
const categoryColors: Record<string, string> = {
  Jadwal:   "bg-blue-500/10 border-blue-500/25 text-blue-300",
  Tugas:    "bg-[#CC0000]/10 border-[#CC0000]/25 text-red-300",
  Teknis:   "bg-orange-500/10 border-orange-500/25 text-orange-300",
  Platform: "bg-violet-500/10 border-violet-500/25 text-violet-300",
  Akun:     "bg-teal-500/10 border-teal-500/25 text-teal-300",
};

// Format teks jawaban — dark theme konsisten
function formatAnswer(text: string) {
  return text.split("\n").map((line, i) => {
    if (line.trim() === "") return <div key={i} className="h-2" />;

    // Bold heading: **teks**
    if (line.startsWith("**") && line.endsWith("**")) {
      return (
        <p key={i} className="text-white font-semibold text-sm mt-3 mb-1">
          {line.slice(2, -2)}
        </p>
      );
    }

    // Numbered list
    if (line.match(/^\d+\./)) {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={i} className="ml-4 text-slate-300 text-sm leading-relaxed">
          {parts.map((p, j) =>
            j % 2 === 1
              ? <strong key={j} className="text-white font-semibold">{p}</strong>
              : p
          )}
        </p>
      );
    }

    // Bullet
    if (line.startsWith("•")) {
      const inner = line.slice(1).trim().split(/\*\*(.*?)\*\*/g);
      return (
        <p key={i} className="ml-4 flex gap-2 text-slate-300 text-sm leading-relaxed">
          <span className="text-[#CC0000] flex-shrink-0 mt-0.5">•</span>
          <span>
            {inner.map((p, j) =>
              j % 2 === 1
                ? <strong key={j} className="text-white font-semibold">{p}</strong>
                : p
            )}
          </span>
        </p>
      );
    }

    // Normal line
    const parts = line.split(/\*\*(.*?)\*\*/g);
    return (
      <p key={i} className="text-slate-300 text-sm leading-relaxed">
        {parts.map((p, j) =>
          j % 2 === 1
            ? <strong key={j} className="text-white font-semibold">{p}</strong>
            : p
        )}
      </p>
    );
  });
}

export function FAQ() {
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [search, setSearch] = useState("");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filtered = faqs.filter((f) => {
    const matchCat = activeCategory === "Semua" || f.category === activeCategory;
    const matchSearch =
      f.q.toLowerCase().includes(search.toLowerCase()) ||
      f.a.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#0D0D0D]">

      {/* ── Header ── */}
      <section className="bg-gradient-to-br from-[#0D0D0D] via-[#130820] to-[#0D0D0D] border-b border-white/5 py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-12 h-12 bg-gradient-to-br from-[#CC0000]/20 to-[#4B1E6B]/20 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-white text-3xl font-bold mb-3">FAQ & Panduan</h1>
            <p className="text-slate-400 text-sm mb-7 max-w-md mx-auto leading-relaxed">
              Jawaban resmi atas pertanyaan paling sering diajukan peserta Coding Camp 2026.
            </p>
            {/* Search */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Cari pertanyaan atau kata kunci..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setOpenIndex(null); }}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#CC0000]/50 focus:bg-white/8 focus:ring-2 focus:ring-[#CC0000]/10 transition-all"
              />
            </div>
          </motion.div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

        {/* ── Warning Banner — dark ── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-start gap-3 bg-[#CC0000]/8 border border-[#CC0000]/20 rounded-xl px-4 py-3.5"
        >
          <Shield className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-slate-300 text-sm">
            <strong className="text-white font-semibold">Pelanggaran Critical:</strong>{" "}
            Menggunakan API GPT/Gemini sebagai model <em>utama</em> dapat menyebabkan ketidaklulusan.
            Model wajib dibangun mandiri dengan TensorFlow.
          </p>
        </motion.div>

        {/* ── Category Filter ── */}
        <div className="flex flex-wrap gap-2 mb-7">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setOpenIndex(null); }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                activeCategory === cat
                  ? "bg-[#CC0000] text-white border-[#CC0000] shadow-sm shadow-red-900/30"
                  : "bg-white/4 text-slate-400 border-white/10 hover:border-white/25 hover:text-white hover:bg-white/8"
              }`}
            >
              {cat}
              {cat !== "Semua" && (
                <span className="ml-1.5 text-[10px] opacity-50">
                  ({faqs.filter((f) => f.category === cat).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── FAQ List ── */}
        <div className="space-y-2">

          {/* Empty state */}
          {filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 bg-white/4 border border-white/8 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-7 h-7 text-slate-600" />
              </div>
              <p className="text-white font-semibold mb-1.5">
                Tidak ada hasil untuk &ldquo;{search}&rdquo;
              </p>
              <p className="text-slate-500 text-sm mb-5 max-w-xs mx-auto">
                Coba kata kunci lain, atau tanyakan langsung ke Copilot AI.
              </p>
              <Link
                to="/chat"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#CC0000] hover:bg-[#A50000] text-white rounded-xl font-semibold text-sm transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                Tanya ke Copilot AI
              </Link>
            </motion.div>
          )}

          {filtered.map((faq, i) => (
            <motion.div
              key={`${faq.category}-${i}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
                openIndex === i
                  ? "bg-[#150D22] border-[#CC0000]/30"
                  : "bg-[#0F0A18] border-white/7 hover:border-white/15 hover:bg-[#130B1E]"
              }`}
            >
              {/* Accordion trigger */}
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left group"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-medium flex-shrink-0 mt-0.5 ${
                    categoryColors[faq.category] ?? "bg-white/5 border-white/10 text-slate-400"
                  }`}>
                    {faq.category}
                  </span>
                  <span className={`text-sm font-medium leading-snug transition-colors ${
                    openIndex === i ? "text-white" : "text-slate-300 group-hover:text-white"
                  }`}>
                    {faq.q}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 flex-shrink-0 ml-3 transition-all duration-200 ${
                  openIndex === i ? "rotate-180 text-[#CC0000]" : "text-slate-600 group-hover:text-slate-400"
                }`} />
              </button>

              {/* Accordion body */}
              <AnimatePresence initial={false}>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: "easeInOut" }}
                  >
                    <div className="px-5 pb-5 pt-1 border-t border-white/5 space-y-0.5">
                      {formatAnswer(faq.a)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* ── CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="mt-6 bg-gradient-to-r from-[#1A0A2E] via-[#200D35] to-[#1A0A2E] border border-white/8 rounded-2xl p-7 text-center"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-[#CC0000] to-[#8B0000] rounded-xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-white font-bold text-lg mb-2">Tidak menemukan jawaban?</h3>
          <p className="text-slate-400 text-sm mb-5 max-w-sm mx-auto leading-relaxed">
            Tanya langsung ke Coding Camp Copilot — model NLP TensorFlow CC26-PSU096 siap menjawab 24/7.
          </p>
          <Link
            to="/chat"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#CC0000] to-[#8B0000] text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-[#CC0000]/20"
          >
            <MessageSquare className="w-4 h-4" />
            Tanya Copilot Sekarang
          </Link>
        </motion.div>

      </div>
    </div>
  );
}
