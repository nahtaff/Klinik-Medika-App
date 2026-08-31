import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Klinik Metro Medika",
    short_name: "Metro Medika",
    description:
      "Informasi klinik, jadwal dokter, FAQ, dan rekam medis Klinik Metro Medika.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0EA5A4",
    lang: "id",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
