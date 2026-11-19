"use client";

import { collection, getDocs } from "firebase/firestore/lite";
import { db } from "@/lib/firestore";
import { groupByKategori, type Faq } from "@/lib/faq";
import { isFilled } from "@/lib/text";
import { useLoad } from "@/lib/useLoad";
import { Card } from "@/components/Card";
import {
  EmptyState,
  ErrorState,
  Skeleton,
  StaleNotice,
} from "@/components/StatusStates";
import { ChevronDownIcon, QuestionMarkIcon } from "@/components/icons";

async function loadFaqs(): Promise<Faq[] | null> {
  const snapshot = await getDocs(collection(db, "config_faq"));
  const items = snapshot.docs
    .map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Faq, "id">) }))
    .filter((faq) => isFilled(faq.pertanyaan) && isFilled(faq.jawaban));
  return items.length > 0 ? items : null;
}

export default function FaqPage() {
  const { status, data: faqs, stale, retry } = useLoad(loadFaqs, "faq");
  const groups = groupByKategori(faqs ?? []);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 py-6 sm:max-w-lg sm:px-6 md:max-w-2xl lg:max-w-3xl xl:max-w-4xl">
      <header>
        <h1 className="font-heading text-2xl font-bold text-primary">FAQ</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Pertanyaan yang sering ditanyakan pasien.
        </p>
      </header>

      {status === "loading" && (
        <Skeleton label="Memuat FAQ" count={3} itemClassName="h-16" />
      )}
      {status === "error" && (
        <ErrorState
          message="Gagal memuat FAQ. Periksa koneksi internet Anda."
          onRetry={retry}
        />
      )}
      {status === "empty" && <EmptyState message="Belum ada FAQ tersedia." />}
      {status === "success" && stale && <StaleNotice />}
      {status === "success" && (
        <div className="flex flex-col gap-4">
          {groups.map((group) => (
            <Card
              key={group.kategori}
              title={group.kategori}
              icon={<QuestionMarkIcon />}
              headingLevel={2}
            >
              <div className="flex flex-col divide-y divide-foreground/10">
                {group.items.map((faq) => (
                  <AccordionItem key={faq.id} faq={faq} />
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}

// Native <details>: buka/tutup tanpa state React, jalan tanpa JavaScript, dan
// jawaban yang tertutup tetap bisa ditemukan lewat "Cari di halaman".
// Chevron di depan teks (bukan di ujung kanan) supaya mudah dikaitkan dengan
// pertanyaannya, terutama bagi pengguna kaca pembesar layar.
function AccordionItem({ faq }: { faq: Faq }) {
  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-start gap-2 py-3 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
        <ChevronDownIcon className="mt-0.5 -rotate-90 text-foreground/50 group-open:rotate-0 motion-safe:transition-transform" />
        {faq.pertanyaan}
      </summary>
      <div className="pb-3 pl-6 text-sm leading-6 text-foreground/70">
        {faq.jawaban}
      </div>
    </details>
  );
}
