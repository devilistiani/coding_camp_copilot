import { Link } from "react-router";
import { motion } from "motion/react";
import {
  Bot, MessageSquare, BookOpen, ArrowRight, Sparkles,
  CheckCircle, Brain, Target, Zap, Shield, BarChart3,
  Users, AlertTriangle, Database, Code2,
} from "lucide-react";


const teamMembers = [
  { init: "RA",  name: "Rizki Alsyareno",          role: "Full-Stack Web Developer", id: "CFCC848D6Y0433" },
  { init: "SNP", name: "Siti Nur Padila",           role: "Full-Stack Web Developer", id: "CFCC809D6X0843" },
  { init: "NHS", name: "Naila Hilwatus Syifa",      role: "AI Engineer",              id: "CACC284D6X1586" },
  { init: "GED", name: "Gabriella Elizabeth D.",    role: "AI Engineer",              id: "CACC284D6X1746" },
  { init: "AS",  name: "Anthony Saputra",           role: "Data Scientist",           id: "CDCC429D6Y0092" },
  { init: "DLS", name: "Devi Listiani Safitri",     role: "Data Scientist",           id: "CDCC226D6X1183" },
];

const roleColors: Record<string, string> = {
  "Full-Stack Web Developer": "from-[#CC0000] to-[#FF4444]",
  "AI Engineer":              "from-[#4B1E6B] to-[#8B2FC9]",
  "Data Scientist":           "from-[#059669] to-[#0D9488]",
};

const mainQuestItems = [
  { icon: Brain,     text: "Model AI TensorFlow Functional API / Subclassing (mandiri, bukan API pihak ketiga)" },
  { icon: Code2,     text: "REST API terintegrasi — ML API + Backend API (Express.js + Node.js)" },
  { icon: Target,    text: "Live URL Aplikasi Web sebagai antarmuka input pertanyaan & respons pintar" },
  { icon: BookOpen,  text: "Dokumentasi lengkap: Laporan Teknis DS (PDF), Project Brief, Slide Presentasi" },
];

const sideQuestItems = [
  { icon: Zap,       text: "Akurasi model > 85% (F1-score, precision, recall terukur)" },
  { icon: BarChart3, text: "Dashboard analitik interaktif berbasis Streamlit (Live URL terpisah)" },
  { icon: Sparkles,  text: "Fitur teks Generative AI sebagai pendukung (draft reply otomatis fasilitator)" },
];

const features = [
  { icon: Brain,     color: "from-[#CC0000] to-[#8B0000]", bg: "bg-[#1A0A2E]/5",  title: "NLP TensorFlow Custom",     desc: "Model Deep Learning dibangun mandiri menggunakan TensorFlow Functional API untuk klasifikasi pertanyaan peserta." },
  { icon: Target,    color: "from-[#059669] to-[#0D9488]",  bg: "bg-emerald-50", title: "Klasifikasi + Urgensi",      desc: "Mengklasifikasikan kategori masalah dan menentukan tingkat urgensi (Low / Medium / High) secara otomatis." },
  { icon: BookOpen,  color: "from-[#CC0000] to-[#8B0000]",     bg: "bg-[#0D0D0D]/5",    title: "RAG Knowledge Base",         desc: "Retrieval-Augmented Generation menarik jawaban dari FAQ resmi, Google Docs, dan dokumen internal Coding Camp." },
  { icon: Sparkles,  color: "from-[#B45309] to-[#D97706]",  bg: "bg-amber-50",   title: "Draft Reply Fasilitator",    desc: "Generative AI menghasilkan draft balasan otomatis untuk membantu fasilitator menjawab lebih cepat." },
  { icon: Database,  color: "from-[#4B1E6B] to-[#8B2FC9]", bg: "bg-[#4B1E6B]/5",  title: "PostgreSQL Knowledge Store", desc: "Database PostgreSQL menyimpan histori percakapan, knowledge base, dan data pengguna dengan aman." },
  { icon: Shield,    color: "from-[#881337] to-[#CC0000]",     bg: "bg-rose-50",    title: "Privasi & Keamanan Data",    desc: "Dataset sintetis dan anonimisasi memastikan informasi peserta tidak disalahgunakan. Tidak ada data sensitif." },
];

const techStack = [
  { group: "Frontend",  items: ["React.js", "TypeScript", "Tailwind CSS", "Vite"] },
  { group: "Backend",   items: ["Express.js", "Node.js", "REST API", "JWT Auth"] },
  { group: "AI / ML",   items: ["TensorFlow", "NLP", "RAG", "Scikit-learn"] },
  { group: "Database",  items: ["PostgreSQL", "JSON/JSONB"] },
  { group: "DevOps",    items: ["GitHub", "GCP / Railway / Render", "Postman", "Trello"] },
];

const problems = [
  "Pertanyaan peserta yang sama berulang kali membebani fasilitator",
  "Informasi tersebar di Google Docs, Spreadsheet, dan berbagai URL berbeda",
  "Peserta kesulitan menemukan jawaban secara mandiri",
  "Fasilitator terlambat menangani pertanyaan yang lebih kompleks",
];

// TODO: bikin section tech stack yang udah didefinisi di atas — belum sempat
// const _techStack = techStack; // nanti dipake

export function Home() {
  return (
    <div className="overflow-hidden">

      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-br from-[#0D0D0D] via-[#1A0A2E] to-[#0D0D0D] text-white overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#CC0000]/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-40 w-80 h-80 bg-[#4B1E6B]/50/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <div className="inline-flex items-center gap-2 bg-[#CC0000]/20 border border-[#CC0000]/30 rounded-full px-4 py-1.5 mb-6">
                <Sparkles className="w-3.5 h-3.5 text-[#FF4444]" />
                <span className="text-[#FF6666] text-xs font-medium">Coding Camp 2026 · DBS Foundation · CC26-PSU096</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-4">
                <span className="text-white">Coding Camp</span><br />
                <span className="bg-gradient-to-r from-[#FF4444] via-[#CC0000] to-[#8B0000] bg-clip-text text-transparent">Copilot</span>
              </h1>
              <p className="text-slate-300 text-lg mb-3 font-medium">Accessible & Adaptive Learning</p>
              <p className="text-slate-400 leading-relaxed mb-8 max-w-lg">
                Sistem AI terpadu yang mengklasifikasikan pertanyaan peserta, menentukan tingkat urgensi,
                dan memberikan draft reply otomatis — mengurangi beban fasilitator dari pertanyaan berulang.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/chat" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#CC0000] to-[#8B0000] text-white rounded-xl hover:shadow-xl hover:shadow-[#CC0000]/30 transition-all font-semibold">
                  <MessageSquare className="w-4 h-4" /> Mulai Chat Sekarang <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/faq" className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all font-semibold">
                  <BookOpen className="w-4 h-4" /> Lihat FAQ
                </Link>
              </div>

              {/* Stats dari Project Plan */}
              <div className="flex flex-wrap gap-8 mt-10 pt-8 border-t border-white/10">
                {[
                  { val: "6 Orang",  label: "Anggota Tim"        },
                  { val: ">85%",     label: "Target Akurasi Model"},
                  { val: "3 Role",   label: "Learning Path"       },
                  { val: "5 Minggu", label: "Durasi Sprint"       },
                ].map(({ val, label }) => (
                  <div key={label}>
                    <p className="text-2xl font-bold text-[#FF4444]">{val}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Mock Chat */}
            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }} className="hidden lg:block relative">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#CC0000] to-[#8B0000] rounded-lg flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">Coding Camp Copilot</p>
                    <p className="text-emerald-400 text-xs flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse inline-block" />
                      Online · NLP TensorFlow Active
                    </p>
                  </div>
                </div>
                <div className="space-y-3 mb-4">
                  <div className="flex gap-2">
                    <div className="w-7 h-7 bg-gradient-to-br from-[#CC0000] to-[#8B0000] rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="bg-white/10 rounded-2xl rounded-tl-sm px-3.5 py-2.5 max-w-xs">
                      <p className="text-slate-200 text-sm">Halo! Saya Copilot CC26-PSU096. Ada pertanyaan seputar Coding Camp 2026? 👋</p>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <div className="bg-[#CC0000]/80 rounded-2xl rounded-tr-sm px-3.5 py-2.5 max-w-xs">
                      <p className="text-white text-sm">Kapan deadline submission capstone project?</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-7 h-7 bg-gradient-to-br from-[#CC0000] to-[#8B0000] rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="space-y-2 max-w-xs">
                      <div className="bg-white/10 rounded-2xl rounded-tl-sm px-3.5 py-2.5">
                        <p className="text-slate-200 text-sm">Deadline capstone adalah <span className="text-[#FF6666] font-semibold">5 Juni 2026</span>. Pastikan Model AI (.keras/SavedModel), REST API, Live URL, Dashboard Streamlit, dan Dokumentasi sudah lengkap.</p>
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        <span className="text-xs bg-blue-500/20 border border-blue-400/30 text-blue-300 px-2 py-0.5 rounded-full">📅 Jadwal</span>
                        <span className="text-xs bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-2 py-0.5 rounded-full">🟢 Low</span>
                        <span className="text-xs bg-white/10 border border-white/20 text-slate-400 px-2 py-0.5 rounded-full">95% konfiden</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                  <p className="flex-1 text-slate-500 text-sm">Tanya seputar Coding Camp 2026...</p>
                  <div className="w-7 h-7 bg-[#CC0000] rounded-lg flex items-center justify-center">
                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
              </div>
              {/* Floating badges */}
              <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-4 -right-4 bg-white rounded-xl px-3 py-2 shadow-xl flex items-center gap-2">
                <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-slate-900 text-xs font-bold">Target Side Quest</p>
                  <p className="text-emerald-600 text-[10px]">Akurasi &gt; 85%</p>
                </div>
              </motion.div>
              <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                className="absolute -bottom-4 -left-4 bg-white rounded-xl px-3 py-2 shadow-xl flex items-center gap-2">
                <div className="w-6 h-6 bg-[#CC0000]/10 rounded-lg flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-[#CC0000]" />
                </div>
                <div>
                  <p className="text-slate-900 text-xs font-bold">RAG Enabled</p>
                  <p className="text-[#CC0000] text-[10px]">Knowledge Base Aktif</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Masalah yang Diselesaikan ── */}
      <section className="py-14 bg-[#141018] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium px-3 py-1 rounded-full mb-4">
                <AlertTriangle className="w-3.5 h-3.5" /> Permasalahan yang Diselesaikan
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">Mengapa Coding Camp Copilot Dibangun?</h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Berdasarkan <span className="text-white font-medium">Project Plan CC26-PSU096</span>, tim mengidentifikasi
                akar permasalahan yang menghambat efisiensi ekosistem Coding Camp 2026:
              </p>
              <div className="space-y-3">
                {problems.map((p, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                    <div className="w-5 h-5 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-red-400 text-[10px] font-bold">{i + 1}</span>
                    </div>
                    <p className="text-slate-300 text-sm">{p}</p>
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-[#CC0000]/10 to-[#4B1E6B]/20 border border-[#CC0000]/20 rounded-2xl p-6">
              <p className="text-[#FF4444] text-xs font-bold uppercase tracking-widest mb-4">Solusi yang Diusulkan</p>
              <h3 className="text-white font-bold text-lg mb-3">Sistem Chat AI Terpadu</h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-5">
                Coding Camp Copilot mengintegrasikan semua sumber informasi (Google Docs, Spreadsheet, FAQ)
                ke dalam satu pintu layanan berbasis AI — menyediakan jawaban cepat, terpusat, dan dapat diakses kapan saja.
              </p>
              <div className="space-y-2">
                {["Klasifikasi kategori pertanyaan otomatis", "Deteksi tingkat urgensi (Low/Medium/High)", "Draft reply otomatis untuk fasilitator", "Knowledge Base terintegrasi dengan RAG"].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Fitur Sistem ── */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-1.5 bg-[#4B1E6B]/5 text-purple-700 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
              <Zap className="w-3.5 h-3.5" /> Fitur Sistem
            </span>
            <h2 className="text-slate-900 text-3xl font-bold mb-3">Arsitektur & Kemampuan Copilot</h2>
            <p className="text-slate-500 text-sm max-w-lg mx-auto">Dibangun dengan stack teknologi sesuai sumber daya yang ditetapkan Project Plan</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md hover:border-[#CC0000]/20 transition-all">
                <div className={`w-10 h-10 ${f.bg} rounded-xl flex items-center justify-center mb-3`}>
                  <div className={`w-5 h-5 bg-gradient-to-br ${f.color} rounded-lg flex items-center justify-center`}>
                    <f.icon className="w-3 h-3 text-white" />
                  </div>
                </div>
                <h3 className="text-slate-900 font-semibold text-sm mb-1.5">{f.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* ── Tim CC26-PSU096 ── */}
      <section className="py-16 bg-gradient-to-br from-[#0D0D0D] via-[#1A0A2E] to-[#0D0D0D] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-1.5 bg-[#CC0000]/20 border border-[#CC0000]/30 text-[#FF6666] text-xs font-medium px-3 py-1 rounded-full mb-4">
              <Users className="w-3.5 h-3.5" /> Tim CC26-PSU096
            </span>
            <h2 className="text-white text-2xl sm:text-3xl font-bold mb-2">Anggota Tim Capstone</h2>
            <p className="text-slate-400 text-sm">6 anggota lintas learning path — FSWD, AI Engineer, Data Scientist</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamMembers.map((m, i) => (
              <motion.div key={m.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3 hover:bg-white/10 transition-all">
                <div className={`w-11 h-11 bg-gradient-to-br ${roleColors[m.role]} rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                  {m.init}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{m.name}</p>
                  <p className="text-[#FF4444] text-xs">{m.role}</p>
                  <p className="text-slate-500 text-[10px] font-mono mt-0.5">{m.id}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-14 bg-gradient-to-r from-[#CC0000] via-[#8B0000] to-[#8B0000]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-white text-2xl sm:text-3xl font-bold mb-3">Siap Mencoba Coding Camp Copilot?</h2>
          <p className="text-[#FFB3B3] text-sm mb-7">Tanyakan apa saja seputar jadwal, materi, tugas, dan masalah teknis Coding Camp 2026.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/chat" className="inline-flex items-center gap-2 px-7 py-3 bg-white text-[#CC0000] rounded-xl hover:shadow-xl transition-all font-semibold">
              <MessageSquare className="w-4 h-4" /> Mulai Chat Sekarang
            </Link>
            <Link to="/faq" className="inline-flex items-center gap-2 px-7 py-3 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all font-semibold">
              Lihat FAQ <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
