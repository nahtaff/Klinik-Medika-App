import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    // Diinjeksi oleh Serwist saat build — daftar aset statis untuk precache.
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// Host yang HARUS di-bypass TOTAL oleh service worker — bukan sekadar
// NetworkOnly. Firestore memakai koneksi streaming (WebChannel
// /Listen/channel) yang rusak jika di-proxy ulang oleh fetch handler SW:
// bahkan NetworkOnly tetap memanggil fetch(request) dan memicu error
// "A ServiceWorker intercepted the request and encountered an unexpected
// error". Firebase Storage juga dibiarkan langsung ke jaringan.
function isBypassHost(hostname: string): boolean {
  return (
    hostname === "firestore.googleapis.com" ||
    hostname === "firebasestorage.googleapis.com" ||
    hostname.endsWith(".firebasestorage.app")
  );
}

// Didaftarkan SEBELUM listener fetch Serwist. Untuk request bypass:
// stopImmediatePropagation() mencegah listener Serwist ikut jalan, dan kita
// SENGAJA tidak memanggil respondWith() → browser menangani request secara
// native. Dengan begitu SW benar-benar tidak menyentuh koneksi Firestore,
// streaming realtime tetap utuh.
self.addEventListener("fetch", (event) => {
  let hostname: string;
  try {
    hostname = new URL(event.request.url).hostname;
  } catch {
    return;
  }
  if (isBypassHost(hostname)) {
    event.stopImmediatePropagation();
  }
});

// Rute sensitif yang TIDAK boleh pernah masuk cache (data kesehatan pribadi
// & gerbang otentikasi). Selalu ambil dari jaringan, tidak pernah disimpan.
function isSensitiveRoute(pathname: string): boolean {
  return (
    pathname === "/rekam-medis" ||
    pathname.startsWith("/rekam-medis/") ||
    pathname === "/login" ||
    pathname.startsWith("/login/")
  );
}

// Endpoint auth/FCM (request-response biasa, bukan streaming) → network-only
// supaya token selalu segar tanpa mengganggu koneksi apa pun.
const NETWORK_ONLY_HOSTS = [
  "firebaseinstallations.googleapis.com",
  "fcmregistrations.googleapis.com",
  "identitytoolkit.googleapis.com",
  "securetoken.googleapis.com",
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // 1. Rute sensitif → network-only, urutan paling atas agar menang.
    {
      matcher: ({ url, sameOrigin }) => sameOrigin && isSensitiveRoute(url.pathname),
      handler: new NetworkOnly(),
    },
    // 2. Endpoint auth/FCM → network-only (selalu terbaru).
    //    (Firestore & Storage sudah di-bypass total di listener fetch atas,
    //    jadi tidak pernah sampai ke sini.)
    {
      matcher: ({ url }) => NETWORK_ONLY_HOSTS.includes(url.hostname),
      handler: new NetworkOnly(),
    },
    // 3. Sisanya pakai strategi default Next.js dari Serwist (NetworkFirst
    //    untuk navigasi & RSC → halaman utama tetap terbuka saat offline
    //    setelah dikunjungi sekali, tanpa over-cache).
    ...defaultCache,
  ],
});

serwist.addEventListeners();
