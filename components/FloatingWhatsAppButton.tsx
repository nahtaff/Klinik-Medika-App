"use client";

import { loadContactInfo } from "@/lib/firestore";
import { isFilled } from "@/lib/text";
import { useLoad } from "@/lib/useLoad";
import { WhatsAppIcon } from "@/components/icons";
import { buildWhatsAppLink } from "@/lib/whatsapp";

// Muncul di semua halaman (dirender dari root layout). Kalau nomor
// WhatsApp belum ada / gagal dimuat, tombol cukup tidak muncul —
// ini elemen pelengkap, bukan konten inti yang butuh error/empty state.
export default function FloatingWhatsAppButton() {
  const { data: contact } = useLoad(loadContactInfo, "contact_info");
  const nomorWhatsapp = contact?.nomor_whatsapp;

  if (!isFilled(nomorWhatsapp)) return null;

  // bottom-24 supaya mengambang di atas bottom navbar, tidak bertabrakan.
  // Padding kiri/kanan tetap interpretar viewport (bukan container konten),
  // supaya di layar lebar tombol nempel di pojok kanan bawah, bukan melayang
  // jauh di tengah halaman.
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-end px-5 md:px-6">
      <a
        href={buildWhatsAppLink(nomorWhatsapp)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Hubungi kami via WhatsApp"
        className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-foreground shadow-lg transition-transform hover:scale-105"
      >
        <WhatsAppIcon className="h-7 w-7" />
      </a>
    </div>
  );
}
