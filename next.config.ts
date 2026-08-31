import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const nextConfig: NextConfig = {
  // Serwist menambahkan konfigurasi webpack (untuk build SW). Next 16 pakai
  // Turbopack di dev dan akan error jika ada webpack config tanpa turbopack
  // config. SW dimatikan di dev, jadi cukup deklarasikan turbopack kosong
  // agar Turbopack mengabaikan konfigurasi webpack tsb. Build production
  // tetap pakai webpack (lihat script "build") supaya SW ter-generate.
  turbopack: {},
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
