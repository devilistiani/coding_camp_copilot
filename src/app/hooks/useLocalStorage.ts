import { useState } from "react";

/**
 * useLocalStorage — hook custom mirip useState tapi data persist ke localStorage.
 *
 * Berguna untuk menyimpan preferensi ringan yang tidak perlu di database
 * (tema, pengaturan tampilan, dll). Histori Chat disimpan dengan hook ini
 * menggunakan key "cc_chat_history".
 *
 * Keterbatasan:
 * - Value harus bisa di-serialize lewat JSON.stringify
 * - Jangan gunakan untuk fungsi atau instance class
 * - Incognito / private browsing mungkin membatasi kuota storage
 *
 * @param key          Nama key di localStorage — gunakan prefix "cc_" untuk konsistensi
 * @param initialValue Nilai awal jika key belum ada di storage
 */
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      // Kalau sudah ada data → parse dan kembalikan
      // Kalau belum ada → pakai initialValue
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      // JSON corrupt atau format berubah dari versi app sebelumnya
      // Daripada crash, fallback ke initialValue dengan aman
      return initialValue;
    }
  });

  /**
   * Setter — update React state sekaligus simpan ke localStorage.
   * Gagal dengan aman jika storage penuh (QuotaExceededError).
   */
  const setValue = (value: T): void => {
    try {
      setStoredValue(value);
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      // Storage penuh atau mode incognito yang membatasi kuota
      // Tetap update state meski tidak bisa persist
      console.error("useLocalStorage: gagal simpan ke storage:", error);
    }
  };

  return [storedValue, setValue];
}

export default useLocalStorage;
