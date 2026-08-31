"use client";

import { useEffect } from "react";

// Mendaftarkan service worker offline (public/sw.js) yang di-build Serwist.
// Hanya jalan di production (di dev SW dimatikan lewat next.config).
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      typeof window === "undefined" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("Registrasi service worker gagal:", error);
    });
  }, []);

  return null;
}
