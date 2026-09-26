"use client";

import { useEffect } from "react";

const SERWIST_SW_PATH = "/sw.js";

// Mencegah loop reload kalau ada chunk yang masih gagal dimuat.
const PURGE_RELOAD_FLAG = "serwist-sw-purge-reloaded";

function isSerwistServiceWorker(
  registration: ServiceWorkerRegistration
): boolean {
  const worker =
    registration.active ?? registration.waiting ?? registration.installing;
  if (!worker) return false;
  try {
    return new URL(worker.scriptURL).pathname === SERWIST_SW_PATH;
  } catch {
    return false;
  }
}

// Di production: daftarkan SW offline (public/sw.js) hasil build Serwist.
// Di dev: jangan daftar, tapi justru BUANG SW Serwist yang tertinggal dari
// `next build` sebelumnya. Serwist mem-cache /_next/static/chunks dengan
// CacheFirst ("next-static-js-assets", defaultCache @serwist/next) yang tidak
// revalidasi, sehingga SW lama menyajikan body chunk produksi ke Turbopack dev
// — yang penamaan chunk-nya berbeda — dan memicu "module factory is not
// available". Jangan ubah ini jadi sekadar skip: tanpa purge, bug itu kembali
// setiap kali ada sisa SW dari build production.
//
// /firebase-messaging-sw.js dikecualikan: SW push itu tetap dipakai saat
// testing notifikasi di dev (lib/messaging.ts) dan tidak memakai Cache Storage.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    if (process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register(SERWIST_SW_PATH).catch((error) => {
        console.error("Registrasi service worker gagal:", error);
      });
      return;
    }

    // Buang SW Serwist + cache-nya, lalu reload sekali agar chunk terambil
    // ulang dari jaringan.
    void (async () => {
      try {
        const registrations =
          await navigator.serviceWorker.getRegistrations();
        const stale = registrations.filter(isSerwistServiceWorker);
        await Promise.all(stale.map((r) => r.unregister()));

        let clearedCaches = 0;
        if ("caches" in window) {
          const keys = await caches.keys();
          clearedCaches = keys.length;
          await Promise.all(keys.map((key) => caches.delete(key)));
        }

        if (
          (stale.length > 0 || clearedCaches > 0) &&
          !sessionStorage.getItem(PURGE_RELOAD_FLAG)
        ) {
          sessionStorage.setItem(PURGE_RELOAD_FLAG, "1");
          window.location.reload();
        }
      } catch (error) {
        console.error("Gagal membersihkan service worker:", error);
      }
    })();
  }, []);

  return null;
}
