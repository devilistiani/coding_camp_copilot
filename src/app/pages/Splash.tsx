import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext";

// ─── Particle component ────────────────────────────────────
function Particle({ delay, x, y, size }: { delay: number; x: number; y: number; size: number }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        left: `${x}%`,
        top:  `${y}%`,
        width:  size,
        height: size,
        background: Math.random() > 0.5
          ? "rgba(227,30,36,0.35)"
          : "rgba(91,26,138,0.35)",
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 0.8, 0],
        scale:   [0, 1, 0],
        y:       [0, -40 - Math.random() * 40],
      }}
      transition={{
        duration: 2.5 + Math.random() * 1.5,
        delay,
        repeat:   Infinity,
        repeatDelay: Math.random() * 2,
        ease: "easeOut",
      }}
    />
  );
}

// posisi partikel di-seed biar deterministic
// kalau Math.random() biasa bakal flicker pas re-render
const PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  id:    i,
  x:     (i * 37 + 11) % 100,
  y:     (i * 53 + 7)  % 100,
  size:  4 + (i % 5) * 3,
  delay: (i * 0.18) % 3,
}));

// ─── Splash Page ───────────────────────────────────────────
export function Splash() {
  const navigate      = useNavigate();
  const { isLoggedIn } = useAuth();
  const [progress,  setProgress]  = useState(0);
  const [phase,     setPhase]     = useState<"loading" | "done">("loading");
  const DURATION_MS = 5000;

  useEffect(() => {
    // Progress bar
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const elapsed = now - start;
      const pct = Math.min((elapsed / DURATION_MS) * 100, 100);
      setProgress(pct);
      if (pct < 100) { raf = requestAnimationFrame(tick); }
      else           { setPhase("done"); }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (phase !== "done") return;
    // Tandai splash sudah ditampilkan di sesi ini
    sessionStorage.setItem("splash_seen", "1");
    const id = setTimeout(() => {
      navigate(isLoggedIn ? "/" : "/login", { replace: true });
    }, 400); // beri jeda singkat supaya animasi "done" terlihat
    return () => clearTimeout(id);
  }, [phase, isLoggedIn, navigate]);

  return (
    <div className="relative min-h-screen bg-[#0D0D0D] flex flex-col items-center justify-center overflow-hidden select-none">

      {/* ── Ambient blobs ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] bg-[#E31E24]/6 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-[#5B1A8A]/8 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[35vw] h-[35vw] bg-[#E31E24]/3 rounded-full blur-[80px]" />
      </div>

      {/* ── Grid texture overlay ── */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(#E31E24 1px, transparent 1px), linear-gradient(90deg, #E31E24 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* ── Particles ── */}
      {PARTICLES.map(p => (
        <Particle key={p.id} x={p.x} y={p.y} size={p.size} delay={p.delay} />
      ))}

      {/* ── Main content ── */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center">

        {/* Logo */}
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
          className="relative"
        >
          {/* Outer glow ring */}
          <motion.div
            className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-[#E31E24]/20 to-[#5B1A8A]/20 blur-xl"
            animate={{ opacity: [0.4, 0.9, 0.4], scale: [1, 1.08, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Icon box */}
          <div className="relative w-28 h-28 bg-gradient-to-br from-[#E31E24] via-[#CC0000] to-[#5B1A8A] rounded-[1.75rem] flex items-center justify-center shadow-2xl shadow-red-900/60">
            {/* Inner circuit lines */}
            <svg viewBox="0 0 56 56" fill="none" className="absolute inset-0 w-full h-full opacity-20">
              <path d="M8 28h6M42 28h6M28 8v6M28 42v6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="28" cy="28" r="12" stroke="white" strokeWidth="1"/>
              <path d="M14 14l4 4M38 38l4 4M38 14l-4 4M14 38l4-4" stroke="white" strokeWidth="1" strokeLinecap="round"/>
            </svg>
            {/* Bot icon */}
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" className="w-12 h-12 relative">
              <rect x="3" y="8" width="18" height="13" rx="2"/>
              <path d="M12 8V5M9 5h6M8 12h.01M16 12h.01M9 16h6"/>
              <circle cx="12" cy="3" r="1"/>
            </svg>
          </div>
        </motion.div>

        {/* Title block */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="space-y-2"
        >
          <h1 className="text-white font-black text-4xl sm:text-5xl tracking-tight leading-none">
            Coding Camp
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#E31E24] via-[#FF4D52] to-[#FF6B6B]">
              Copilot
            </span>
          </h1>
          <p className="text-slate-400 text-sm font-medium tracking-widest uppercase">
            CC26-PSU096 · DBS Foundation 2026
          </p>
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="text-slate-500 text-sm max-w-xs leading-relaxed"
        >
          Asisten AI cerdas untuk peserta Coding Camp &mdash;<br/>
          jadwal, materi, tugas, semua dalam satu tempat.
        </motion.p>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.4 }}
          className="w-64 space-y-2"
        >
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#E31E24] to-[#FF4D52] rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ ease: "linear" }}
            />
          </div>

          <AnimatePresence mode="wait">
            {phase === "loading" ? (
              <motion.p
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-slate-600 text-xs text-center tabular-nums"
              >
                Memuat sistem… {Math.round(progress)}%
              </motion.p>
            ) : (
              <motion.p
                key="done"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-emerald-400 text-xs text-center font-medium"
              >
                ✓ Sistem siap — mengalihkan…
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Pill badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="flex flex-wrap justify-center gap-2"
        >   
        </motion.div>
      </div>

      {/* ── Footer ── */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="absolute bottom-8 text-slate-700 text-[11px] text-center px-4"
      >
        Coding Camp 2026 ×{" "}
        <span className="text-[#E31E24]">DBS Foundation</span>
        {" "}· Road to Future Workforce
      </motion.p>
    </div>
  );
}
