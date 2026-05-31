import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider } from "./context/AuthContext";

/**
 * App — komponen root Coding Camp Copilot.
 *
 * Urutan wrapper (luar ke dalam):
 * 1. AuthProvider   → menyediakan context auth (user, login, logout) ke seluruh tree
 * 2. RouterProvider → mengelola navigasi berbasis URL
 *
 * AuthProvider harus berada di LUAR RouterProvider agar komponen di dalam
 * route (Root, Chat, Admin, dll) bisa mengakses useAuth() tanpa error.
 *
 * Proyek: CC26-PSU096 — Coding Camp 2026 × DBS Foundation
 * Tema  : Accessible & Adaptive Learning
 */
export function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
