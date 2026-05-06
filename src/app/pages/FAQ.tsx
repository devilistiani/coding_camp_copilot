import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, ChevronDown, BookOpen, MessageSquare, AlertTriangle } from "lucide-react";
import { Link } from "react-router";

// TODO: nanti ambil categories ini dari API biar bisa diupdate tanpa deploy ulang
// untuk sekarang hardcode dulu
const categories = ["Semua", "Jadwal", "Tugas", "Teknis", "Platform", "Akun"];

const faqs = [
  // ── Jadwal ──────────────────────────────────────────────
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
  // ── Tugas & Penilaian ────────────────────────────────────
  {
    category: "Tugas",
    q: "Apa saja kriteria penilaian capstone project?",
    a: "Penilaian dibagi dua bagian:\n\nMain Quest (Wajib — harus dipenuhi):\n• Model AI dibangun mandiri dengan TensorFlow Functional API atau Subclassing\n• REST API terintegrasi (ML + Backend)\n• Live URL Aplikasi Web\n• Dokumentasi lengkap (Laporan PDF, Project Brief, Slide)\n\nSide Quest (Bonus nilai tambah):\n• Akurasi model > 85% (diukur F1-score, precision, recall)\n• Dashboard Streamlit interaktif dengan Live URL terpisah\n• Fitur teks Generative AI sebagai pendukung (draft reply)\n\nPenting: API GPT/Gemini untuk fitur UTAMA = pelanggaran Critical!",
  },
  {
    category: "Tugas",
    q: "Apakah boleh menggunakan API GPT atau Gemini untuk model utama?",
    a: "TIDAK BOLEH. Ini adalah pelanggaran Critical yang dapat menyebabkan ketidaklulusan.\n\nYang WAJIB: membangun model Deep Learning secara mandiri menggunakan TensorFlow Functional API atau Subclassing. Tim AI Engineer berkomitmen melakukan code review berkala untuk memastikan tidak ada import model eksternal yang tidak diizinkan.\n\nYang BOLEH: API Generative AI hanya sebagai fitur PENDUKUNG (bukan model utama), contohnya untuk draft reply otomatis fasilitator.\n\nRujukan: Risk Management Framework Project Plan CC26-PSU096 — Risiko Level Critical.",
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
  // ── Teknis ───────────────────────────────────────────────
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
  // ── Platform ─────────────────────────────────────────────
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
  // ── Akun ────────────────────────────────────────────────
  {
    category: "Akun",
    q: "Bagaimana cara login ke Coding Camp Copilot?",
    a: "Akses Copilot melalui Live URL yang sudah dideploy tim.\n\nUntuk demo lokal, gunakan kredensial berikut:\n• Peserta: peserta@codingcamp.id / copilot2026\n• Fasilitator: fasilitator@codingcamp.id / fasil2026\n\nPerbedaan mode:\n• Peserta: dapat mengajukan pertanyaan dan menerima jawaban AI\n• Fasilitator: fitur tambahan Draft Reply otomatis di setiap jawaban AI — bisa langsung disalin untuk membalas peserta\n\nSistem auth menggunakan JWT yang terhubung ke backend Express.js + PostgreSQL.",
  },
];

// render teks FAQ dengan format sederhana
// mirip sama Markdown di Chat.tsx tapi versi light (ga perlu semua case)
function formatAnswer(text: string) {
  return text.split("\n").map((line, i) => {
    if (line.trim() === "") return <div key={i} className="h-1" />;
    if (line.match(/^\d+\./)) {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return <p key={i} className="ml-4 text-slate-700 text-sm">{parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}</p>;
    }
    if (line.startsWith("•")) {
      return <p key={i} className="ml-4 flex gap-2 text-slate-700 text-sm"><span className="text-[#CC0000] flex-shrink-0">•</span><span>{line.slice(1).trim()}</span></p>;
    }
    const parts = line.split(/\*\*(.*?)\*\*/g);
    return <p key={i} className="text-slate-700 text-sm leading-relaxed">{parts.map((p, j) => j % 2 === 1 ? <strong key={j} className="text-slate-900">{p}</strong> : p)}</p>;
  });
}

// warna badge per kategori — light mode karena FAQ page background putih
// beda sama Chat yang dark
const categoryColors: Record<string, string> = {
  Jadwal:   "bg-blue-50 border-blue-200 text-blue-700",
  Tugas:    "bg-[#1A0A2E]/5 border-[#CC0000]/30 text-[#CC0000]",
  Teknis:   "bg-orange-50 border-orange-200 text-orange-700",
  Platform: "bg-purple-50 border-purple-200 text-purple-700",
  Akun:     "bg-teal-50 border-teal-200 text-teal-700",
};

export function FAQ() {
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [search, setSearch] = useState("");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filtered = faqs.filter((f) => {
    const matchCat = activeCategory === "Semua" || f.category === activeCategory;
    const matchSearch = f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <section className="bg-gradient-to-br from-[#0D0D0D] via-[#1A0A2E] to-[#0D0D0D] text-white py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-12 h-12 bg-[#CC0000]/20 border border-[#CC0000]/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-6 h-6 text-[#FF4444]" />
            </div>
            <div className="inline-flex items-center gap-2 bg-[#CC0000]/20 border border-[#CC0000]/30 rounded-full px-3 py-1 mb-3">
              <span className="text-[#FF6666] text-xs">CC26-PSU096 · Coding Camp 2026 · DBS Foundation</span>
            </div>
            <h1 className="text-3xl font-bold mb-3">FAQ & Panduan</h1>
            <p className="text-slate-400 text-sm mb-6 max-w-lg mx-auto">
              Jawaban resmi atas pertanyaan paling sering diajukan peserta Coding Camp 2026.
            </p>
            {/* Search */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Cari pertanyaan atau kata kunci..."
                value={search} onChange={(e) => { setSearch(e.target.value); setOpenIndex(null); }}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000] transition-all"
              />
            </div>
          </motion.div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Warning banner */}
        <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">
            <strong>Pelanggaran Critical:</strong> Menggunakan API GPT/Gemini sebagai model UTAMA dapat menyebabkan ketidaklulusan. Model wajib dibangun mandiri dengan TensorFlow.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((cat) => (
            <button key={cat} onClick={() => { setActiveCategory(cat); setOpenIndex(null); }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                activeCategory === cat
                  ? "bg-[#CC0000] text-white border-[#CC0000] shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:border-[#CC0000]/50 hover:text-[#CC0000]"
              }`}>
              {cat}
              {cat !== "Semua" && (
                <span className="ml-1.5 text-[10px] opacity-60">
                  ({faqs.filter(f => f.category === cat).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div className="space-y-2.5">
          {filtered.length === 0 && (
            <div className="text-center py-14 text-slate-400">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Tidak ditemukan untuk "{search}"</p>
              <p className="text-sm mt-1">Coba kata kunci lain atau tanya langsung ke Copilot AI</p>
            </div>
          )}
          {filtered.map((faq, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-[#CC0000]/20 transition-colors">
              <button onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium flex-shrink-0 mt-0.5 ${categoryColors[faq.category] ?? "bg-slate-50 border-slate-200 text-slate-600"}`}>
                    {faq.category}
                  </span>
                  <span className="text-slate-800 font-medium text-sm leading-snug">{faq.q}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 ml-3 transition-transform duration-200 ${openIndex === i ? "rotate-180 text-[#CC0000]" : ""}`} />
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}>
                    <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-1">
                      {formatAnswer(faq.a)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="mt-10 bg-gradient-to-r from-[#CC0000] to-[#8B0000] rounded-2xl p-6 text-center text-white">
          <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-80" />
          <h3 className="font-bold text-lg mb-2">Tidak menemukan jawaban?</h3>
          <p className="text-[#FFB3B3] text-sm mb-4">
            Tanya langsung ke Coding Camp Copilot — model NLP TensorFlow CC26-PSU096 siap menjawab 24/7.
          </p>
          <Link to="/chat"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-[#CC0000] rounded-xl font-semibold text-sm hover:shadow-lg transition-all">
            <MessageSquare className="w-4 h-4" />
            Tanya Copilot Sekarang
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
