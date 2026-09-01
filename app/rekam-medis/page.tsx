"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  collection,
  getDoc,
  getDocs,
  orderBy,
  query,
  type DocumentReference,
  type Timestamp,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import { RequireAuth } from "@/components/RequireAuth";
import { EmptyState, ErrorState, Skeleton } from "@/components/StatusStates";
import { CalendarIcon, PersonIcon } from "@/components/icons";

interface MedicalRecord {
  id: string;
  tanggal_kunjungan?: Timestamp;
  dokter_id?: DocumentReference;
  keluhan?: string;
  diagnosis?: string;
  resep_obat?: string;
  catatan?: string;
  dokterNama?: string;
}

type Status = "loading" | "success" | "empty" | "error";

function isFilled(value: string | undefined | null): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

const tanggalFormatter = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatTanggal(timestamp: Timestamp | undefined): string | null {
  if (!timestamp?.toDate) return null;
  return tanggalFormatter.format(timestamp.toDate());
}

// Resolve nama dokter dari dokter_id (reference). Klinik satu dokter, jadi
// semua record menunjuk doc yang sama — di-cache per path supaya cukup satu
// pembacaan, bukan satu per entri.
async function resolveDoctorNames(
  records: MedicalRecord[]
): Promise<MedicalRecord[]> {
  const cache = new Map<string, string | undefined>();

  for (const record of records) {
    const ref = record.dokter_id;
    if (!ref || cache.has(ref.path)) continue;
    try {
      const snap = await getDoc(ref);
      const nama = snap.exists()
        ? (snap.data() as { nama?: string }).nama
        : undefined;
      cache.set(ref.path, isFilled(nama) ? nama : undefined);
    } catch (error) {
      console.error("Gagal memuat data dokter:", error);
      cache.set(ref.path, undefined);
    }
  }

  return records.map((record) => ({
    ...record,
    dokterNama: record.dokter_id ? cache.get(record.dokter_id.path) : undefined,
  }));
}

function RekamMedisContent() {
  const { user } = useAuth();
  const uid = user?.uid;

  const [status, setStatus] = useState<Status>("loading");
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [signingOut, setSigningOut] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Selalu pakai uid dari sesi — tidak pernah hardcode. Security Rules
  // menjamin hanya users/{uid} milik pemanggil yang bisa dibaca, jadi ini
  // tidak mungkin menampilkan riwayat pasien lain.
  const fetchRecords = useCallback(async () => {
    if (!uid) return;
    try {
      const snapshot = await getDocs(
        query(
          collection(db, "users", uid, "medical_records"),
          orderBy("tanggal_kunjungan", "desc")
        )
      );
      if (!mountedRef.current) return;

      if (snapshot.empty) {
        setStatus("empty");
        return;
      }

      const raw: MedicalRecord[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<MedicalRecord, "id" | "dokterNama">),
      }));
      const resolved = await resolveDoctorNames(raw);
      if (!mountedRef.current) return;

      setRecords(resolved);
      setStatus("success");
    } catch (error) {
      console.error("Gagal memuat rekam medis:", error);
      if (mountedRef.current) setStatus("error");
    }
  }, [uid]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleRetry = useCallback(() => {
    setStatus("loading");
    fetchRecords();
  }, [fetchRecords]);

  const handleLogout = useCallback(async () => {
    setSigningOut(true);
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Gagal keluar:", error);
      setSigningOut(false);
    }
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 py-6 sm:max-w-lg sm:px-6">
      <header>
        <h1 className="font-heading text-2xl font-bold text-primary">
          Rekam Medis
        </h1>
        <p className="mt-1 text-sm text-foreground/60">
          Riwayat kunjungan untuk {user?.phoneNumber ?? "nomor terverifikasi"}.
        </p>
      </header>

      {status === "loading" && (
        <Skeleton label="Memuat rekam medis" count={3} itemClassName="h-28" />
      )}
      {status === "error" && (
        <ErrorState
          message="Gagal memuat rekam medis. Periksa koneksi internet Anda."
          onRetry={handleRetry}
        />
      )}
      {status === "empty" && (
        <EmptyState message="Anda belum memiliki riwayat kunjungan." />
      )}
      {status === "success" && <MedicalTimeline records={records} />}

      <button
        type="button"
        onClick={handleLogout}
        disabled={signingOut}
        className="mt-2 rounded-full border border-foreground/15 px-4 py-2.5 text-sm font-medium text-foreground disabled:opacity-60"
      >
        {signingOut ? "Keluar..." : "Keluar"}
      </button>
    </main>
  );
}

function MedicalTimeline({ records }: { records: MedicalRecord[] }) {
  return (
    <ol className="relative ml-1.5 flex flex-col gap-4 border-l-2 border-primary/20 pl-5">
      {records.map((record) => (
        <li key={record.id} className="relative">
          <span
            aria-hidden="true"
            className="absolute -left-[27px] top-4 h-3.5 w-3.5 rounded-full border-2 border-primary bg-background"
          />
          <RecordCard record={record} />
        </li>
      ))}
    </ol>
  );
}

function RecordCard({ record }: { record: MedicalRecord }) {
  const tanggal = formatTanggal(record.tanggal_kunjungan);

  return (
    <article className="rounded-2xl border border-foreground/10 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5 border-b border-foreground/10 pb-3">
          {tanggal && (
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="text-primary">
                <CalendarIcon />
              </span>
              {tanggal}
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-foreground/70">
            <span className="text-primary">
              <PersonIcon className="h-4 w-4" />
            </span>
            {isFilled(record.dokterNama) ? record.dokterNama : "Dokter"}
          </div>
        </div>

        <dl className="flex flex-col gap-2.5">
          <Field label="Keluhan" value={record.keluhan} />
          <Field label="Diagnosis" value={record.diagnosis} />
          <Field label="Resep Obat" value={record.resep_obat} />
          <Field label="Catatan" value={record.catatan} />
        </dl>
      </div>
    </article>
  );
}

// Field kosong tidak dirender (bukan "undefined") — konsisten dengan F1.
function Field({ label, value }: { label: string; value: string | undefined }) {
  if (!isFilled(value)) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-foreground/45">
        {label}
      </dt>
      <dd className="text-sm leading-6 text-foreground/85">{value}</dd>
    </div>
  );
}

export default function RekamMedisPage() {
  return (
    <RequireAuth>
      <RekamMedisContent />
    </RequireAuth>
  );
}
