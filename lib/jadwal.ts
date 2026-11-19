import { normalizeHari, type Hari } from "@/lib/hari";

export interface JadwalEntry {
  hari?: string;
  jam_mulai?: string;
  jam_selesai?: string;
}

export interface Sesi {
  jam_mulai: string;
  jam_selesai: string;
}

// Satu hari bisa punya beberapa sesi (mis. pagi & sore), jadi tiap hari
// menampung daftar sesi, urut sesuai data. Entri tidak lengkap atau dengan
// nama hari yang tidak dikenal dilewati, bukan bikin crash.
export function groupJadwalByHari(
  entries: (JadwalEntry | null | undefined)[] | undefined
): Map<Hari, Sesi[]> {
  const byHari = new Map<Hari, Sesi[]>();
  for (const entry of entries ?? []) {
    const hari = normalizeHari(entry?.hari ?? "");
    const jam_mulai = entry?.jam_mulai?.trim();
    const jam_selesai = entry?.jam_selesai?.trim();
    if (!hari || !jam_mulai || !jam_selesai) continue;

    const sesi = byHari.get(hari) ?? [];
    sesi.push({ jam_mulai, jam_selesai });
    byHari.set(hari, sesi);
  }
  return byHari;
}
