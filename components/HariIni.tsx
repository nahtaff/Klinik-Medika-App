"use client";

import { useEffect, useState } from "react";
import { hariIniKey, statusHariIni, type Hari } from "@/lib/hari";

// Halaman publik di-cache (ISR) dan bisa saja pertama dibuka keesokan
// harinya, jadi bagian yang bergantung pada "hari ini" dihitung ulang dengan
// jam perangkat setelah hydration. Nilai awal dari server menjaga HTML tetap
// berisi dan hydration tetap cocok.

export function StatusHariIni({
  jamOperasional,
  awal,
}: {
  jamOperasional: Record<string, string> | undefined;
  awal: string | null;
}) {
  const [status, setStatus] = useState(awal);
  useEffect(() => setStatus(statusHariIni(jamOperasional)), [jamOperasional]);

  return (
    <p
      className={`mt-1 text-sm ${
        status ? "font-medium text-foreground" : "text-foreground/60"
      }`}
    >
      {status ?? "Jam buka, alamat, dan kontak klinik."}
    </p>
  );
}

export function BadgeHariIni({
  hariPraktik,
  awal,
}: {
  hariPraktik: Hari[];
  awal: boolean;
}) {
  const [tersedia, setTersedia] = useState(awal);
  useEffect(() => setTersedia(hariPraktik.includes(hariIniKey())), [hariPraktik]);

  return (
    <AvailabilityBadge
      available={tersedia}
      label={tersedia ? "Tersedia Hari Ini" : "Tidak Praktik Hari Ini"}
    />
  );
}

export function AvailabilityBadge({
  available,
  label,
}: {
  available: boolean;
  label: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
        available
          ? "bg-primary/10 text-primary"
          : "bg-foreground/5 text-foreground/70"
      }`}
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full ${
          available ? "bg-primary" : "bg-foreground/30"
        }`}
      />
      {label}
    </span>
  );
}
