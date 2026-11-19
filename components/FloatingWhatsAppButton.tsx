import { isFilled } from "@/lib/text";
import { WhatsAppIcon } from "@/components/icons";
import { buildWhatsAppLink } from "@/lib/whatsapp";

// Muncul di semua halaman; nomornya dibaca root layout di server. Kalau nomor
// WhatsApp belum ada / gagal dimuat, tombol cukup tidak muncul — ini elemen
// pelengkap, bukan konten inti yang butuh error/empty state.
export default function FloatingWhatsAppButton({
  nomorWhatsapp,
}: {
  nomorWhatsapp: string | undefined;
}) {
  if (!isFilled(nomorWhatsapp)) return null;

  // 6rem di atas bottom navbar, ditambah safe area: di iPhone (dibuka dari
  // Layar Utama) navbar ikut memanjang ~34px, jadi tanpa itu tombol menimpanya.
  // Padding kiri/kanan mengikuti viewport (bukan container konten), supaya di
  // layar lebar tombol menempel di pojok kanan bawah, bukan melayang di tengah.
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-50 flex justify-end px-5 md:px-6">
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
