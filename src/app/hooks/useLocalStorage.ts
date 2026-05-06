import { useState } from "react";

/**
 * useLocalStorage — mirip useState biasa tapi data persist ke localStorage
 *
 * berguna buat nyimpen preferensi user, settings, dll
 * yang ga perlu disimpen di database
 *
 * contoh pemakaian:
 *   const [theme, setTheme] = useLocalStorage("app_theme", "dark");
 *
 * catatan: value harus bisa di-JSON.stringify
 * kalau mau nyimpen fungsi/class jangan pake hook ini
 */
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      // ada data sebelumnya? parse. Belum ada? pakai initial value
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      // bisa corrupt kalau data di storage udah beda format dari versi lama
      // safe fallback ke initial value
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      // gagal kalau storage penuh atau browser incognito mode
      // ga perlu crash — log aja
      console.error("useLocalStorage: gagal simpan ke storage:", error);
    }
  };

  return [storedValue, setValue];
}

export default useLocalStorage;
