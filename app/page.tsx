"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { HARI_LABEL, HARI_URUTAN } from "@/lib/hari";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { Card } from "@/components/Card";
import { EmptyState, ErrorState, Skeleton } from "@/components/StatusStates";
import {
  CheckIcon,
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  StethoscopeIcon,
  WhatsAppIcon,
} from "@/components/icons";
import { NotificationSetup } from "@/components/NotificationSetup";
import { QuickAccessGrid } from "@/components/QuickAccessGrid";

interface ContactInfo {
  nama_klinik?: string;
  alamat?: string;
  nomor_whatsapp?: string;
  nomor_telepon?: string;
  jam_operasional?: Record<string, string>;
  layanan?: string[];
}

type Status = "loading" | "success" | "empty" | "error";

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
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-6 sm:max-w-lg sm:px-6">
      <GreetingCard />

      <section id="informasi" className="flex scroll-mt-20 flex-col gap-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          Informasi Klinik
        </h2>

        {status === "loading" && (
          <Skeleton label="Memuat informasi klinik" count={3} />
        )}
        {status === "error" && (
          <ErrorState
            message="Gagal memuat informasi klinik. Periksa koneksi internet Anda."
            onRetry={handleRetry}
          />
        )}
        {status === "empty" && (
          <EmptyState message="Informasi klinik belum tersedia." />
        )}
        {status === "success" && info && <InfoContent info={info} />}
      </section>

      <QuickAccessGrid />

      <NotificationSetup />
    </main>
  );
}

function GreetingCard() {
  return (
    <div className="rounded-2xl bg-primary p-5 text-primary-foreground shadow-sm">
      <h1 className="font-heading text-lg font-bold leading-snug">
        Selamat datang di Klinik Metro Medika
      </h1>
      <p className="mt-1 text-sm text-primary-foreground/85">
        Layanan kesehatan untuk Anda
      </p>
    </div>
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
    <div className="flex flex-col gap-4">
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
                href={buildWhatsAppLink(info.nomor_whatsapp!)}
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

      {hasLayanan && (
        <Card title="Layanan" icon={<StethoscopeIcon />}>
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

