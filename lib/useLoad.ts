import { useCallback, useEffect, useState } from "react";

export type LoadStatus = "loading" | "success" | "empty" | "error";

interface LoadState<T> {
  status: LoadStatus;
  data: T | null;
  // true kalau data diambil dari cache karena jaringan gagal (mis. offline)
  stale: boolean;
}

const CACHE_PREFIX = "klinik-cache:";

// localStorage bisa melempar (mode privat, storage diblokir, kuota penuh)
// atau berisi JSON rusak. Cache hanya pelengkap, jadi kegagalannya diabaikan.
export function readCache<T>(storage: Storage | undefined, key: string): T | null {
  try {
    const raw = storage?.getItem(CACHE_PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeCache(
  storage: Storage | undefined,
  key: string,
  value: unknown
): void {
  try {
    storage?.setItem(CACHE_PREFIX + key, JSON.stringify(value));
  } catch {
    // Gagal simpan = saat offline halaman tampil error, seperti sebelum ada cache.
  }
}

function browserStorage(): Storage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

// Pola ambil-sekali untuk data yang dibaca di browser (rekam medis, tombol
// WhatsApp): loading/success/empty/error plus retry. `load` harus stabil
// (fungsi modul atau useCallback) dan mengembalikan null untuk "data kosong".
//
// Dengan `cacheKey`, hasil sukses terakhir disimpan di localStorage dan
// dipakai saat jaringan gagal (offline, F6). JANGAN beri cacheKey untuk data
// pribadi seperti rekam medis.
export function useLoad<T>(load: () => Promise<T | null>, cacheKey?: string) {
  const [state, setState] = useState<LoadState<T>>({
    status: "loading",
    data: null,
    stale: false,
  });

  // Tanpa penjaga "masih mounted": sejak React 18, setState setelah unmount
  // diabaikan tanpa peringatan.
  const run = useCallback(async () => {
    try {
      const data = await load();
      if (data === null) {
        setState({ status: "empty", data: null, stale: false });
        return;
      }
      if (cacheKey) writeCache(browserStorage(), cacheKey, data);
      setState({ status: "success", data, stale: false });
    } catch (error) {
      console.error(`Gagal memuat data${cacheKey ? ` (${cacheKey})` : ""}:`, error);
      const cached = cacheKey ? readCache<T>(browserStorage(), cacheKey) : null;
      setState(
        cached === null
          ? { status: "error", data: null, stale: false }
          : { status: "success", data: cached, stale: true }
      );
    }
  }, [load, cacheKey]);

  useEffect(() => {
    void run();
  }, [run]);

  const retry = useCallback(() => {
    setState({ status: "loading", data: null, stale: false });
    void run();
  }, [run]);

  return { ...state, retry };
}
