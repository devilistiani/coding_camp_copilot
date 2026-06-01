import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider } from "./context/AuthContext";

// entry point component — AuthProvider harus paling luar
// supaya semua child bisa akses useAuth()
// supaya semua child bisa akses useAuth() dari mana aja
export function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
