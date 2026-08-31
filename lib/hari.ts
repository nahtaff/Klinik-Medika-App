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
