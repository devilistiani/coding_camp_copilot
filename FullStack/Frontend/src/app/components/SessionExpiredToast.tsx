import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LockKeyhole } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function SessionExpiredToast() {
  const { sessionExpiredAt, clearSessionExpired } = useAuth();

  useEffect(() => {
    if (!sessionExpiredAt) return;

    const path = window.location.pathname;
    const onAuthPage = path === "/login" || path === "/register";

    if (!onAuthPage) {
      const redirectTimer = setTimeout(() => {
        window.location.assign("/login");
      }, 1200);
      const dismissTimer = setTimeout(() => {
        clearSessionExpired();
      }, 4500);
      return () => {
        clearTimeout(redirectTimer);
        clearTimeout(dismissTimer);
      };
    }

    const dismissTimer = setTimeout(() => {
      clearSessionExpired();
    }, 4500);
    return () => clearTimeout(dismissTimer);
  }, [sessionExpiredAt, clearSessionExpired]);

  return (
    <AnimatePresence>
      {sessionExpiredAt && (
        <motion.div
          initial={{ opacity: 0, y: -16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] bg-amber-50 border border-amber-300 text-amber-900 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 max-w-md"
          role="alert"
        >
          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <LockKeyhole className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-sm">
            <p className="font-semibold">Sesi habis</p>
            <p className="text-amber-800 text-xs">Silakan login ulang untuk melanjutkan.</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
