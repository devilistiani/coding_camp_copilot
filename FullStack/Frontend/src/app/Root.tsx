import { Outlet, Navigate } from "react-router";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { SessionExpiredToast } from "./components/SessionExpiredToast";
import { useAuth } from "./context/AuthContext";

// Root layout — wrapper untuk semua halaman protected
// kalau belum login, redirect ke splash atau login
// kalau belum login, redirect ke splash atau login
export function Root() {
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    // Cek apakah user udah pernah lihat splash screen sebelumnya
    // Splash.tsx yang set "splash_seen" ke sessionStorage waktu animasinya selesai
    const splashSeen = sessionStorage.getItem("splash_seen");
    if (!splashSeen) return <Navigate to="/splash" replace />;
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <SessionExpiredToast />
      <Navbar />
      <main className="flex-1">
        {/* Outlet = tempat child routes dirender (Home, Chat, FAQ, dll) */}
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
