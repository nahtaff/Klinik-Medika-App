import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { loadContactInfo } from "@/lib/firestore";
import FloatingWhatsAppButton from "@/components/FloatingWhatsAppButton";
import { BottomNav } from "@/components/BottomNav";
import { TopBar } from "@/components/TopBar";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: "Klinik Metro Medika",
  title: "Klinik Metro Medika",
  description:
    "Informasi klinik, jadwal dokter, dan rekam medis Klinik Metro Medika.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Metro Medika",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0EA5A4",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Semua halaman dirender di server dan di-cache (ISR): data Firestore sudah
// ada di HTML, jadi tidak menunggu JS + request dari browser (LCP), dan
// halaman yang disimpan service worker tetap berisi saat offline. Dibuat
// ulang di latar belakang paling cepat tiap 60 detik: pengunjung pertama
// setelah data diubah di Console masih melihat versi lama, berikutnya yang baru.
export const revalidate = 60;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Tombol WhatsApp hanya pelengkap: kalau gagal dimuat, sembunyikan saja.
  const contact = await loadContactInfo().catch((error) => {
    console.error("Gagal memuat nomor WhatsApp:", error);
    return null;
  });

  return (
    <html
      lang="id"
      className={`${inter.variable} ${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <TopBar />
        <div className="flex flex-1 flex-col pb-32">{children}</div>
        <FloatingWhatsAppButton nomorWhatsapp={contact?.nomor_whatsapp} />
        <BottomNav />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
