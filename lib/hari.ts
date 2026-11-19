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

// getDay(): 0 = Minggu ... 6 = Sabtu
const JS_DAY_TO_HARI: Hari[] = [
  "minggu",
  "senin",
  "selasa",
  "rabu",
  "kamis",
  "jumat",
  "sabtu",
];

export function hariIniKey(): Hari {
  return JS_DAY_TO_HARI[new Date().getDay()];
}
