import { Outlet, Navigate } from "react-router";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { ApiStatusBanner } from "./components/ApiStatusBanner";
import { useAuth } from "./context/AuthContext";

/**
 * Root — layout wrapper + auth guard untuk semua halaman terproteksi.
 *
 * Kalau belum login:
 * - Belum pernah lihat splash → redirect ke /splash
 * - Sudah pernah lihat splash → redirect ke /login
 *
 * Kalau sudah login:
 * - Render Navbar + ApiStatusBanner + konten halaman + Footer
 *
 * ApiStatusBanner tampil otomatis saat backend tidak bisa dijangkau,
 * memberi tahu user bahwa Chat berjalan dalam mode demo/mock.
 */
export function Root() {
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    const splashSeen = sessionStorage.getItem("splash_seen");
    return <Navigate to={splashSeen ? "/login" : "/splash"} replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      {/* Banner muncul otomatis kalau backend offline — bisa di-dismiss */}
      <ApiStatusBanner />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
