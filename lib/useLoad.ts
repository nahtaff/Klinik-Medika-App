import { useCallback, useEffect, useState } from "react";

export type LoadStatus = "loading" | "success" | "empty" | "error";

interface LoadState<T> {
  status: LoadStatus;
  data: T | null;
}

// Pola ambil-sekali untuk data yang hanya bisa dibaca di browser karena butuh
// sesi pasien (rekam medis): loading/success/empty/error plus retry. `load`
// harus stabil (useCallback) dan mengembalikan null untuk "data kosong".
// Sengaja tanpa cache: data kesehatan pribadi tidak disimpan di perangkat.
export function useLoad<T>(load: () => Promise<T | null>) {
  const [state, setState] = useState<LoadState<T>>({
    status: "loading",
    data: null,
  });

  // Tanpa penjaga "masih mounted": sejak React 18, setState setelah unmount
  // diabaikan tanpa peringatan.
  const run = useCallback(async () => {
    try {
      const data = await load();
      setState(
        data === null
          ? { status: "empty", data: null }
          : { status: "success", data }
      );
    } catch (error) {
      console.error("Gagal memuat data:", error);
      setState({ status: "error", data: null });
    }
  }, [load]);

  useEffect(() => {
    void run();
  }, [run]);

  const retry = useCallback(() => {
    setState({ status: "loading", data: null });
    void run();
  }, [run]);

  return { ...state, retry };
}
