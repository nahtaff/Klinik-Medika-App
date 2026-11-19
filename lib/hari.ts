export const HARI_URUTAN = [
  "senin",
  "selasa",
  "rabu",
  "kamis",
  "jumat",
  "sabtu",
  "minggu",
] as const;

export type Hari = (typeof HARI_URUTAN)[number];

export const HARI_LABEL: Record<Hari, string> = {
  senin: "Senin",
  selasa: "Selasa",
  rabu: "Rabu",
  kamis: "Kamis",
  jumat: "Jumat",
  sabtu: "Sabtu",
  minggu: "Minggu",
};

// Nama hari diketik manual di Firebase Console ("Senin", " JUMAT", "Jum'at"),
// jadi samakan dulu ke kunci HARI_URUTAN. null = bukan nama hari yang dikenal.
export function normalizeHari(value: string): Hari | null {
  const key = value.toLowerCase().replace(/[^a-z]/g, "");
  return HARI_URUTAN.find((hari) => hari === key) ?? null;
}

// Untuk map berkunci nama hari dari Console (mis. contact_info.jam_operasional).
// Nilai kosong dan kunci yang bukan nama hari dilewati.
export function mapByHari(
  record: Record<string, string | undefined> | undefined
): Map<Hari, string> {
  const byHari = new Map<Hari, string>();
  for (const [key, value] of Object.entries(record ?? {})) {
    const hari = normalizeHari(key);
    const text = value?.trim();
    if (hari && text) byHari.set(hari, text);
  }
  return byHari;
}

// Hari dihitung di WIB, bukan zona waktu mesin: halaman publik juga dirender
// di server Vercel yang berjalan di UTC (07:00 WIB lebih awal).
const HARI_WIB = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  timeZone: "Asia/Jakarta",
});
const EN_TO_HARI: Record<string, Hari> = {
  Sun: "minggu",
  Mon: "senin",
  Tue: "selasa",
  Wed: "rabu",
  Thu: "kamis",
  Fri: "jumat",
  Sat: "sabtu",
};

export function hariIniKey(): Hari {
  return EN_TO_HARI[HARI_WIB.format(new Date())];
}

// Jawaban pertama yang dicari pasien di Beranda: "hari ini buka jam berapa?".
// null kalau jam operasional belum diisi, supaya tidak salah bilang "tutup".
export function statusHariIni(
  jamOperasional: Record<string, string | undefined> | undefined
): string | null {
  const jamByHari = mapByHari(jamOperasional);
  if (jamByHari.size === 0) return null;
  const jam = jamByHari.get(hariIniKey());
  return jam ? `Hari ini buka, ${jam}` : "Hari ini tutup";
}
