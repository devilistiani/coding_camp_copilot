import { createBrowserRouter } from "react-router";
import { Root } from "./Root";
import { Home } from "./pages/Home";
import { Chat } from "./pages/Chat";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Admin } from "./pages/Admin";
import { FAQ } from "./pages/FAQ";
import { NotFound } from "./pages/NotFound";
import { Splash } from "./pages/Splash";
import { History } from "./pages/History";
import { Profile } from "./pages/Profile";

/**
 * Routing aplikasi Coding Camp Copilot.
 *
 * Struktur:
 * - Halaman publik (tanpa auth): /splash, /login, /register
 * - Halaman terproteksi (butuh login): semua di bawah "/"
 *   → Root yang handle redirect jika belum login
 *   → Admin.tsx yang handle redirect jika role bukan admin
 */
export const router = createBrowserRouter([
  // ── Halaman Publik ────────────────────────────────────────────────────────
  { path: "/splash",   Component: Splash   },
  { path: "/login",    Component: Login    },
  { path: "/register", Component: Register },

  // ── Halaman Terproteksi ───────────────────────────────────────────────────
  {
    path: "/",
    Component: Root,
    children: [
      { index: true,     Component: Home    },
      { path: "chat",    Component: Chat    },
      { path: "faq",     Component: FAQ     },
      { path: "history", Component: History },
      { path: "profile", Component: Profile },
      { path: "admin",   Component: Admin   }, // Admin.tsx redirect non-admin ke "/"
      { path: "*",       Component: NotFound },
    ],
  },
]);
