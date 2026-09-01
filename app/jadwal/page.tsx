"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { HARI_LABEL, HARI_URUTAN, hariIniKey } from "@/lib/hari";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { Card } from "@/components/Card";
import { EmptyState, ErrorState, Skeleton } from "@/components/StatusStates";
import { ClockIcon, PersonIcon, WhatsAppIcon } from "@/components/icons";

interface JadwalEntry {
  hari?: string;
  jam_mulai?: string;
  jam_selesai?: string;
}

interface Doctor {
  nama?: string;
  spesialisasi?: string;
  foto_url?: string;
  jadwal_praktik?: JadwalEntry[];
}

type Status = "loading" | "success" | "empty" | "error";

function isFilled(value: string | undefined | null): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export default function JadwalDokter() {
  const [status, setStatus] = useState<Status>("loading");
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [whatsapp, setWhatsapp] = useState<string | undefined>(undefined);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Klinik satu dokter → ambil satu dokumen saja, tidak ada pemilihan dokter.
  const fetchJadwal = useCallback(async () => {
    try {
      const [doctorSnap, contactSnap] = await Promise.all([
        getDocs(query(collection(db, "doctors"), limit(1))),
        getDocs(query(collection(db, "contact_info"), limit(1))),
      ]);
      if (!mountedRef.current) return;

      if (!contactSnap.empty) {
        const contact = contactSnap.docs[0].data() as {
          nomor_whatsapp?: string;
        };
        setWhatsapp(contact.nomor_whatsapp);
      }

      if (doctorSnap.empty) {
        setStatus("empty");
        return;
      }
      setDoctor(doctorSnap.docs[0].data() as Doctor);
      setStatus("success");
    } catch (error) {
      console.error("Gagal memuat jadwal dokter:", error);
      if (mountedRef.current) setStatus("error");
    }
  }, []);

  useEffect(() => {
    fetchJadwal();
  }, [fetchJadwal]);

  const handleRetry = useCallback(() => {
    setStatus("loading");
    fetchJadwal();
  }, [fetchJadwal]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 py-6 sm:max-w-lg sm:px-6">
      <header>
        <h1 className="font-heading text-2xl font-bold text-primary">
          Jadwal Dokter
        </h1>
        <p className="mt-1 text-sm text-foreground/60">
          Jadwal praktik dokter di klinik ini bersifat tetap.
        </p>
      </header>

      {status === "loading" && (
        <Skeleton label="Memuat jadwal dokter" count={2} itemClassName="h-24" />
      )}
      {status === "error" && (
        <ErrorState
          message="Gagal memuat jadwal dokter. Periksa koneksi internet Anda."
          onRetry={handleRetry}
        />
      )}
      {status === "empty" && (
        <EmptyState message="Data dokter belum tersedia." />
      )}
      {status === "success" && doctor && (
        <JadwalContent doctor={doctor} whatsapp={whatsapp} />
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

  const rawEntries = doctor.jadwal_praktik ?? [];
  const hasJadwalData = rawEntries.length > 0;

  const jadwalByHari = new Map<string, JadwalEntry>();
  for (const entry of rawEntries) {
    if (
      isFilled(entry?.hari) &&
      isFilled(entry?.jam_mulai) &&
      isFilled(entry?.jam_selesai)
    ) {
      jadwalByHari.set(entry.hari!.trim().toLowerCase(), entry);
    }
  }

  const tersediaHariIni = jadwalByHari.has(hariIniKey());

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
            <AvailabilityBadge
              available={tersediaHariIni}
              label={
                tersediaHariIni ? "Tersedia Hari Ini" : "Tidak Praktik Hari Ini"
              }
            />
          </div>
        )}
      </section>

      <Card title="Jadwal Praktik" icon={<ClockIcon />}>
        {hasJadwalData ? (
          <ul className="flex flex-col divide-y divide-foreground/10">
            {HARI_URUTAN.map((hari) => {
              const entry = jadwalByHari.get(hari);
              return (
                <li
                  key={hari}
                  className="flex items-center justify-between gap-2 py-2 text-sm"
                >
                  <span className="text-foreground/70">
                    {HARI_LABEL[hari]}
                  </span>
                  <div className="flex items-center gap-2">
                    {entry && (
                      <span className="font-medium text-foreground">
                        {entry.jam_mulai} - {entry.jam_selesai}
                      </span>
                    )}
                    <AvailabilityBadge
                      available={Boolean(entry)}
                      label={entry ? "Tersedia" : "Tutup"}
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

      {hasWhatsapp && (
        <a
          href={buildWhatsAppLink(
            whatsapp!,
            "Halo, saya ingin membuat janji temu"
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90"
        >
          <WhatsAppIcon />
          Hubungi via WhatsApp untuk janji temu
        </a>
      )}
    </div>
  );
}

function AvailabilityBadge({
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
          : "bg-foreground/5 text-foreground/50"
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

