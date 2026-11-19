import { loadContactInfo, type ContactInfo } from "@/lib/firestore";
import { HARI_LABEL, HARI_URUTAN, mapByHari, statusHariIni } from "@/lib/hari";
import { buildMapsLink } from "@/lib/maps";
import { isFilled } from "@/lib/text";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { Card } from "@/components/Card";
import { StatusHariIni } from "@/components/HariIni";
import { EmptyState } from "@/components/StatusStates";
import {
  CheckIcon,
  ClockIcon,
  ContactBookIcon,
  MapPinIcon,
  PhoneIcon,
  StethoscopeIcon,
  WhatsAppIcon,
} from "@/components/icons";
import { NotificationSetup } from "@/components/NotificationSetup";

// Dirender di server dan di-cache (ISR): konten sudah ada di HTML, jadi tidak
// menunggu JS + request Firestore dari browser (LCP), dan halaman yang
// tersimpan service worker tetap berisi saat offline. Halaman dibuat ulang di
// latar belakang paling cepat tiap 60 detik: pengunjung pertama setelah data
// diubah di Console masih melihat versi lama, pengunjung berikutnya yang baru.
export const revalidate = 60;

export default async function Home() {
  const info = await loadContactInfo();

  // Lebar konten (NFR-02): mobile <640px tetap ramping seperti semula
  // (max-w-md / sm:max-w-lg), melebar bertahap di tablet (md:max-w-2xl),
  // desktop (lg:max-w-3xl), dan dikunci di xl:max-w-4xl supaya layar sangat
  // lebar (>1536px) tidak membuat baris teks terlalu panjang. Pola kelas
  // yang sama dipakai halaman Jadwal, FAQ, Rekam Medis, dan TopBar.
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-6 sm:max-w-lg sm:px-6 md:max-w-2xl lg:max-w-3xl xl:max-w-4xl">
      <header>
        <h1 className="font-heading text-2xl font-bold text-primary">
          Informasi Klinik
        </h1>
        <StatusHariIni
          jamOperasional={info?.jam_operasional}
          awal={statusHariIni(info?.jam_operasional)}
        />
      </header>

      {info ? (
        <InfoContent info={info} />
      ) : (
        <EmptyState message="Informasi klinik belum tersedia." />
      )}

      <NotificationSetup />
    </main>
  );
}

function InfoContent({ info }: { info: ContactInfo }) {
  const jamByHari = mapByHari(info.jam_operasional);
  const jamEntries = HARI_URUTAN.filter((hari) => jamByHari.has(hari)).map(
    (hari) => ({ hari, label: HARI_LABEL[hari], jam: jamByHari.get(hari)! })
  );

  const layananItems = (info.layanan ?? []).filter(isFilled);

  const hasAlamat = isFilled(info.alamat);
  const mapsLink = buildMapsLink(info);
  const hasLokasi = hasAlamat || mapsLink !== null;
  const hasTelepon = isFilled(info.nomor_telepon);
  const hasWhatsapp = isFilled(info.nomor_whatsapp);
  const hasKontak = hasTelepon || hasWhatsapp;
  const hasJadwal = jamEntries.length > 0;
  const hasLayanan = layananItems.length > 0;

  if (!hasLokasi && !hasKontak && !hasJadwal && !hasLayanan) {
    return <EmptyState message="Detail klinik belum dilengkapi." />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {hasLokasi && (
        <Card title="Alamat" icon={<MapPinIcon />} headingLevel={2}>
          {hasAlamat && (
            <p className="text-sm leading-6 text-foreground/80">
              {info.alamat}
            </p>
          )}
          {mapsLink && (
            <a
              href={mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex min-h-11 items-center text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              Buka di Google Maps
            </a>
          )}
        </Card>
      )}

      {hasKontak && (
        <Card title="Kontak" icon={<ContactBookIcon />} headingLevel={2}>
          <div className="flex flex-col gap-3">
            {hasTelepon && (
              <a
                href={`tel:${info.nomor_telepon!.replace(/[^\d+]/g, "")}`}
                className="flex min-h-11 items-center gap-2 text-sm text-foreground/80 underline-offset-4 hover:text-primary hover:underline"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <PhoneIcon />
                </span>
                {info.nomor_telepon}
              </a>
            )}
            {hasWhatsapp && (
              <a
                href={buildWhatsAppLink(info.nomor_whatsapp!)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-11 items-center gap-2 text-sm text-foreground/80 underline-offset-4 hover:text-primary hover:underline"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-whatsapp/10 text-whatsapp">
                  <WhatsAppIcon />
                </span>
                {info.nomor_whatsapp} (WhatsApp)
              </a>
            )}
          </div>
        </Card>
      )}

      {hasJadwal && (
        <Card title="Jam Operasional" icon={<ClockIcon />} headingLevel={2}>
          <ul className="flex flex-col divide-y divide-foreground/10">
            {jamEntries.map(({ hari, label, jam }) => (
              <li
                key={hari}
                className="flex items-center justify-between py-2 text-sm"
              >
                <span className="text-foreground/70">{label}</span>
                <span className="font-medium text-foreground">{jam}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {hasLayanan && (
        <Card title="Layanan" icon={<StethoscopeIcon />} headingLevel={2}>
          <ul className="flex flex-col gap-2.5">
            {layananItems.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-sm text-foreground/80"
              >
                <span className="mt-0.5 text-primary">
                  <CheckIcon className="h-4 w-4" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

