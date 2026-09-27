import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const nextConfig: NextConfig = {
  // Serwist menambahkan konfigurasi webpack (untuk build SW). Next 16 pakai
  // Turbopack di dev dan akan error jika ada webpack config tanpa turbopack
  // config. SW dimatikan di dev, jadi cukup deklarasikan turbopack kosong
  // agar Turbopack mengabaikan konfigurasi webpack tsb. Build production
  // tetap pakai webpack (lihat script "build") supaya SW ter-generate.
  turbopack: {},

  // Aset di /public/ default-nya dilayani `max-age=0`, jadi browser
  // mengunduh ulang semuanya tiap visit. Next sudah otomatis cache
  // `/_next/static/*` sebagai immutable, jadi ini hanya untuk public/.
  async headers() {
    const immutable = [
      { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
    ];
    return [
      {
        // Ikon PWA & gambar: isinya stabil, aman di-cache setahun penuh.
        source: "/icons/:path*",
        headers: immutable,
      },
      {
        source: "/:path*.svg",
        headers: immutable,
      },
      {
        // Service worker HARUS revalidasi, kalau tidak update F6 PWA
        // tidak pernah sampai ke user. Sengaja tidak di-cache lama.
        source: "/:path*.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, must-revalidate" },
        ],
      },
    ];
  },
};

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  // Service worker hanya diaktifkan pada build production. Di dev (Turbopack)
  // SW dimatikan supaya tidak mengganggu hot-reload & menghindari cache basi.
  disable: process.env.NODE_ENV === "development",
  // Jangan precache chunk halaman sensitif. Rute /rekam-medis sudah
  // network-only di sw.ts; ini memastikan kodenya pun tidak ikut disimpan.
  // (Serwist tetap menambahkan exclude default-nya sendiri ke daftar ini.)
  exclude: [/app[\\/]rekam-medis/],
});

export default withSerwist(nextConfig);
