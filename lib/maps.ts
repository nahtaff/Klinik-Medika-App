import { isFilled } from "@/lib/text";

interface MapsSource {
  link_maps?: string;
  nama_klinik?: string;
  alamat?: string;
}

// Link "Buka di Google Maps" untuk kartu Alamat. Utamakan link_maps (link
// "Bagikan" dari pin klinik yang diisi di Console, paling akurat). Kalau
// kosong, cari nama klinik + alamat lewat URL resmi Google Maps (tanpa API
// key). link_maps masuk ke href, jadi hanya https yang diterima.
export function buildMapsLink(info: MapsSource): string | null {
  if (isFilled(info.link_maps) && isHttpsUrl(info.link_maps.trim())) {
    return info.link_maps.trim();
  }
  if (!isFilled(info.alamat)) return null;

  const query = [info.nama_klinik, info.alamat].filter(isFilled).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
