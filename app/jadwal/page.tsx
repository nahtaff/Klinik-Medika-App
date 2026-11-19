import { collection, getDocs, limit, query } from "firebase/firestore/lite";
import { db, loadContactInfo } from "@/lib/firestore";
import { HARI_LABEL, HARI_URUTAN, hariIniKey } from "@/lib/hari";
import { groupJadwalByHari, type JadwalEntry } from "@/lib/jadwal";
import { isFilled } from "@/lib/text";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { Card } from "@/components/Card";
import { AvailabilityBadge, BadgeHariIni } from "@/components/HariIni";
import { EmptyState } from "@/components/StatusStates";
import { ClockIcon, PersonIcon, WhatsAppIcon } from "@/components/icons";

// Dirender di server dan di-cache (ISR), sama seperti Beranda.
export const revalidate = 60;

interface Doctor {
  nama?: string;
  spesialisasi?: string;
  foto_url?: string;
  jadwal_praktik?: JadwalEntry[];
}

function daySeparatorClass(index: number): string {
  return index < 2 ? "" : "md:border-t border-foreground/10";
}

// Klinik satu dokter → ambil satu dokumen saja, tidak ada pemilihan dokter.
async function loadJadwal(): Promise<{
  doctor: Doctor;
  whatsapp?: string;
} | null> {
  const [doctorSnap, contact] = await Promise.all([
    getDocs(query(collection(db, "doctors"), limit(1))),
    loadContactInfo(),
  ]);
  if (doctorSnap.empty) return null;
  return {
    doctor: doctorSnap.docs[0].data() as Doctor,
    whatsapp: contact?.nomor_whatsapp,
  };
}

export default async function JadwalDokter() {
  const data = await loadJadwal();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 py-6 sm:max-w-lg sm:px-6 md:max-w-2xl lg:max-w-3xl xl:max-w-4xl">
      <header>
        <h1 className="font-heading text-2xl font-bold text-primary">
          Jadwal Dokter
        </h1>
        <p className="mt-1 text-sm text-foreground/60">
          Jadwal praktik dokter di klinik ini bersifat tetap.
        </p>
      </header>

      {data ? (
        <JadwalContent doctor={data.doctor} whatsapp={data.whatsapp} />
      ) : (
        <EmptyState message="Data dokter belum tersedia." />
      )}
    </main>
  );
}

function JadwalContent({
  doctor,
  whatsapp,
}: {
  doctor: Doctor;
  whatsapp: string | undefined;
}) {
  const hasNama = isFilled(doctor.nama);
  const hasSpesialisasi = isFilled(doctor.spesialisasi);
  const hasFoto = isFilled(doctor.foto_url);
  const hasWhatsapp = isFilled(whatsapp);

  const jadwalByHari = groupJadwalByHari(doctor.jadwal_praktik);
  const hasJadwalData = jadwalByHari.size > 0;

  if (!hasNama && !hasSpesialisasi && !hasFoto && !hasJadwalData) {
    return <EmptyState message="Data dokter belum dilengkapi." />;
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl border border-foreground/10 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-4">
          {hasFoto ? (
            // eslint-disable-next-line @next/next/no-img-element -- foto_url berasal dari Firebase Storage, domain tidak diketahui di build time
            <img
              src={doctor.foto_url}
              alt={hasNama ? doctor.nama : "Foto dokter"}
              className="h-16 w-16 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <PersonIcon />
            </span>
          )}
          <div className="min-w-0 flex-1">
            {hasNama && (
              <h2 className="truncate font-heading text-lg font-bold text-foreground">
                {doctor.nama}
              </h2>
            )}
            {hasSpesialisasi && (
              <p className="truncate text-sm text-foreground/60">
                {doctor.spesialisasi}
              </p>
            )}
          </div>
        </div>

        {hasJadwalData && (
          <div className="mt-3">
            <BadgeHariIni
              hariPraktik={[...jadwalByHari.keys()]}
              awal={jadwalByHari.has(hariIniKey())}
            />
          </div>
        )}

        {/* Baris, bukan tombol hijau, seperti di mockup: hijau WhatsApp
            terlalu terang untuk teks putih (1.98:1). */}
        {hasWhatsapp && (
          <a
            href={buildWhatsAppLink(
              whatsapp!,
              "Halo, saya ingin membuat janji temu"
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex min-h-11 items-center gap-2 border-t border-foreground/10 pt-3 text-sm font-semibold text-foreground underline-offset-4 hover:underline"
          >
            <WhatsAppIcon className="h-5 w-5 shrink-0 text-whatsapp" />
            Hubungi via WhatsApp untuk janji temu
          </a>
        )}
      </section>

      <Card title="Jadwal Praktik" icon={<ClockIcon />}>
        {hasJadwalData ? (
          <ul className="grid gap-x-6 divide-y divide-foreground/10 md:grid-cols-2 md:divide-y-0">
            {HARI_URUTAN.map((hari, index) => {
              const sesi = jadwalByHari.get(hari);
              return (
                <li
                  key={hari}
                  className={`flex items-center justify-between gap-2 py-2 text-sm ${daySeparatorClass(index)}`}
                >
                  <span className="text-foreground/70">
                    {HARI_LABEL[hari]}
                  </span>
                  <div className="flex items-center gap-2">
                    {sesi && (
                      <span className="flex flex-col text-right font-medium text-foreground">
                        {sesi.map(({ jam_mulai, jam_selesai }, i) => (
                          <span key={i}>
                            {jam_mulai} - {jam_selesai}
                          </span>
                        ))}
                      </span>
                    )}
                    <AvailabilityBadge
                      available={Boolean(sesi)}
                      label={sesi ? "Tersedia" : "Tutup"}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="py-2 text-center text-sm text-foreground/60">
            Jadwal praktik belum tersedia.
          </p>
        )}
      </Card>
    </div>
  );
}

