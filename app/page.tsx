"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface ContactInfo {
  nama_klinik?: string;
  alamat?: string;
  nomor_whatsapp?: string;
  nomor_telepon?: string;
  jam_operasional?: Record<string, string>;
}

type Status = "loading" | "success" | "empty" | "error";

const HARI_URUTAN = [
  "senin",
  "selasa",
  "rabu",
  "kamis",
  "jumat",
  "sabtu",
  "minggu",
] as const;

const HARI_LABEL: Record<string, string> = {
  senin: "Senin",
  selasa: "Selasa",
  rabu: "Rabu",
  kamis: "Kamis",
  jumat: "Jumat",
  sabtu: "Sabtu",
  minggu: "Minggu",
};

function isFilled(value: string | undefined | null): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export default function Home() {
  const [status, setStatus] = useState<Status>("loading");
  const [info, setInfo] = useState<ContactInfo | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // getDocs tidak menerima AbortSignal, jadi request-nya tidak bisa
  // dibatalkan beneran — cukup abaikan hasilnya kalau sudah unmount.
  const fetchContactInfo = useCallback(async () => {
    try {
      const snapshot = await getDocs(
        query(collection(db, "contact_info"), limit(1))
      );
      if (!mountedRef.current) return;
      if (snapshot.empty) {
        setStatus("empty");
        return;
      }
      setInfo(snapshot.docs[0].data() as ContactInfo);
      setStatus("success");
    } catch (error) {
      console.error("Gagal memuat contact_info:", error);
      if (mountedRef.current) setStatus("error");
    }
  }, []);

  useEffect(() => {
    fetchContactInfo();
  }, [fetchContactInfo]);

  const handleRetry = useCallback(() => {
    setStatus("loading");
    fetchContactInfo();
  }, [fetchContactInfo]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 py-6 sm:max-w-lg sm:px-6">
      <header>
        <h1 className="font-heading text-2xl font-bold text-primary">
          Informasi Klinik
        </h1>
        <p className="mt-1 text-sm text-foreground/60">
          Jam operasional, alamat, dan kontak klinik.
        </p>
      </header>

      {status === "loading" && <InfoSkeleton />}
      {status === "error" && <ErrorState onRetry={handleRetry} />}
      {status === "empty" && (
        <EmptyState message="Informasi klinik belum tersedia." />
      )}
      {status === "success" && info && <InfoContent info={info} />}
    </main>
  );
}

function InfoContent({ info }: { info: ContactInfo }) {
  const jamEntries = HARI_URUTAN.filter((hari) =>
    isFilled(info.jam_operasional?.[hari])
  ).map((hari) => ({
    hari,
    label: HARI_LABEL[hari],
    jam: info.jam_operasional![hari],
  }));

  const hasNama = isFilled(info.nama_klinik);
  const hasAlamat = isFilled(info.alamat);
  const hasTelepon = isFilled(info.nomor_telepon);
  const hasWhatsapp = isFilled(info.nomor_whatsapp);
  const hasKontak = hasTelepon || hasWhatsapp;
  const hasJadwal = jamEntries.length > 0;

  if (!hasNama && !hasAlamat && !hasKontak && !hasJadwal) {
    return <EmptyState message="Detail klinik belum dilengkapi." />;
  }

  return (
    <div className="flex flex-col gap-4">
      {hasNama && (
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">
            {info.nama_klinik}
          </h2>
          <span className="mt-1.5 block h-1 w-10 rounded-full bg-primary" />
        </div>
      )}

      {hasAlamat && (
        <Card title="Alamat" icon={<MapPinIcon />}>
          <p className="text-sm leading-6 text-foreground/80">
            {info.alamat}
          </p>
        </Card>
      )}

      {hasKontak && (
        <Card title="Kontak" icon={<PhoneIcon />}>
          <div className="flex flex-col gap-3">
            {hasTelepon && (
              <a
                href={`tel:${info.nomor_telepon!.replace(/[^\d+]/g, "")}`}
                className="flex items-center gap-2 text-sm text-foreground/80 underline-offset-4 hover:text-primary hover:underline"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <PhoneIcon />
                </span>
                {info.nomor_telepon}
              </a>
            )}
            {hasWhatsapp && (
              <a
                href={`https://wa.me/${info.nomor_whatsapp!.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-foreground/80 underline-offset-4 hover:text-primary hover:underline"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <WhatsAppIcon />
                </span>
                {info.nomor_whatsapp} (WhatsApp)
              </a>
            )}
          </div>
        </Card>
      )}

      {hasJadwal && (
        <Card title="Jam Operasional" icon={<ClockIcon />}>
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
    </div>
  );
}

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-foreground/10 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          {icon}
        </span>
        <h3 className="font-heading text-sm font-semibold text-foreground">
          {title}
        </h3>
      </div>
      {children}
    </section>
  );
}

function InfoSkeleton() {
  return (
    <div
      className="flex flex-col gap-4"
      role="status"
      aria-label="Memuat informasi klinik"
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-20 animate-pulse rounded-2xl bg-foreground/5"
        />
      ))}
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-6 text-center"
    >
      <p className="text-sm text-red-700">
        Gagal memuat informasi klinik. Periksa koneksi internet Anda.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Coba lagi
      </button>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-foreground/10 bg-white p-6 text-center text-sm text-foreground/60">
      {message}
    </div>
  );
}

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4 shrink-0"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 5a2 2 0 0 1 2-2h2.28a1 1 0 0 1 .95.68l1.2 3.6a1 1 0 0 1-.27 1.05L7.6 9.9a12.05 12.05 0 0 0 6.5 6.5l1.57-1.56a1 1 0 0 1 1.05-.27l3.6 1.2a1 1 0 0 1 .68.95V19a2 2 0 0 1-2 2h-1C9.16 21 3 14.84 3 7V5z"
      />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4 shrink-0"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21z"
      />
      <circle cx="12" cy="9.5" r="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4 shrink-0"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-4 w-4 shrink-0"
      aria-hidden="true"
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.39 1.26 4.81L2 22l5.42-1.42a9.85 9.85 0 0 0 4.62 1.17h.01c5.46 0 9.9-4.45 9.9-9.91C21.95 6.45 17.5 2 12.04 2zm5.8 14.03c-.24.68-1.39 1.3-1.92 1.38-.49.08-1.11.11-1.79-.11a16.6 16.6 0 0 1-1.62-.6c-2.85-1.23-4.7-4.1-4.85-4.29-.14-.19-1.16-1.54-1.16-2.94 0-1.4.73-2.09 1-2.38.26-.28.57-.35.76-.35.19 0 .38 0 .55.01.18.01.41-.07.64.49.24.57.81 1.98.88 2.12.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.17-.29.37-.42.5-.14.14-.28.29-.12.57.16.28.71 1.18 1.53 1.91 1.05.94 1.94 1.23 2.22 1.37.28.14.44.12.6-.07.17-.19.71-.83.9-1.11.19-.28.38-.24.63-.14.26.09 1.65.78 1.94.92.28.14.47.21.54.33.07.12.07.68-.17 1.36z" />
    </svg>
  );
}
