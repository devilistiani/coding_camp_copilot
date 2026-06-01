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

// route definitions
// TODO: tambah route /admin kalau nanti ada fitur admin panel
// Root sebagai layout wrapper untuk halaman-halaman yang butuh auth
export const router = createBrowserRouter([
  // Splash screen — ditampilkan sekali pas pertama buka aplikasi
  {
    path: "/splash",
    Component: Splash,
  },
  // Halaman login — accessible tanpa auth
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/register",
    Component: Register,
  },
  // Semua halaman yang butuh login dibungkus sama Root
  // Root yang handle redirect kalau belum login
  {
    path: "/",
    Component: Root,
    children: [
      { index: true,     Component: Home    },
      { path: "chat",    Component: Chat    },
      { path: "faq",     Component: FAQ     },
      { path: "history", Component: History },
      { path: "profile", Component: Profile },
      { path: "admin",   Component: Admin   },
      { path: "*",       Component: NotFound }, // fallback 404
    ],
  },
]);
