"use client";

import { loadContactInfo, type ContactInfo } from "@/lib/firestore";
import { HARI_LABEL, HARI_URUTAN, mapByHari, statusHariIni } from "@/lib/hari";
import { isFilled } from "@/lib/text";
import { useLoad } from "@/lib/useLoad";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { Card } from "@/components/Card";
import {
  EmptyState,
  ErrorState,
  Skeleton,
  StaleNotice,
} from "@/components/StatusStates";
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

export default function Home() {
  const {
    status,
    data: info,
    stale,
    retry,
  } = useLoad(loadContactInfo, "contact_info");
  const today = statusHariIni(info?.jam_operasional);

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
        {/* min-h-5 holds the line while loading, so the status text that
            arrives with the data doesn't push the page down. */}
        <p
          className={`mt-1 min-h-5 text-sm ${
            today ? "font-medium text-foreground" : "text-foreground/60"
          }`}
        >
          {today ?? "Jam buka, alamat, dan kontak klinik."}
        </p>
      </header>

      {stale && <StaleNotice />}

      <div
        className={
          // reserves the loaded layout's real height, measured from the
          // production record: 912px while 1-col, 494px once 2-col. Without
          // it the skeleton->content swap shoves NotificationSetup down and
          // costs ~0.26 CLS. Loading-only, so error/empty stay compact.
          status === "loading" ? "min-h-[912px] md:min-h-[494px]" : undefined
        }
      >
        {status === "loading" && (
          <Skeleton label="Memuat informasi klinik" count={3} />
        )}
        {status === "error" && (
          <ErrorState
            message="Gagal memuat informasi klinik. Periksa koneksi internet Anda."
            onRetry={retry}
          />
        )}
        {status === "empty" && (
          <EmptyState message="Informasi klinik belum tersedia." />
        )}
        {status === "success" && info && <InfoContent info={info} />}
      </div>

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
  const hasTelepon = isFilled(info.nomor_telepon);
  const hasWhatsapp = isFilled(info.nomor_whatsapp);
  const hasKontak = hasTelepon || hasWhatsapp;
  const hasJadwal = jamEntries.length > 0;
  const hasLayanan = layananItems.length > 0;

  if (!hasAlamat && !hasKontak && !hasJadwal && !hasLayanan) {
    return <EmptyState message="Detail klinik belum dilengkapi." />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {hasAlamat && (
        <Card title="Alamat" icon={<MapPinIcon />} headingLevel={2}>
          <p className="text-sm leading-6 text-foreground/80">
            {info.alamat}
          </p>
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

