"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { collection, getDocs } from "firebase/firestore/lite";
import { db } from "@/lib/firestore";
import { Card } from "@/components/Card";
import { EmptyState, ErrorState, Skeleton } from "@/components/StatusStates";
import { ChevronDownIcon, QuestionMarkIcon } from "@/components/icons";

interface Faq {
  id: string;
  pertanyaan?: string;
  jawaban?: string;
  kategori?: string;
  urutan?: number;
}

interface FaqGroup {
  kategori: string;
  items: Faq[];
}

type Status = "loading" | "success" | "empty" | "error";

function isFilled(value: string | undefined | null): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function groupByKategori(faqs: Faq[]): FaqGroup[] {
  const sorted = [...faqs].sort(
    (a, b) =>
      (a.urutan ?? Number.MAX_SAFE_INTEGER) -
      (b.urutan ?? Number.MAX_SAFE_INTEGER)
  );

  const groups: FaqGroup[] = [];
  const indexByKategori = new Map<string, number>();

  for (const faq of sorted) {
    const kategori = isFilled(faq.kategori) ? faq.kategori : "Lainnya";
    let index = indexByKategori.get(kategori);
    if (index === undefined) {
      index = groups.length;
      indexByKategori.set(kategori, index);
      groups.push({ kategori, items: [] });
    }
    groups[index].items.push(faq);
  }

  return groups;
}

export default function FaqPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchFaqs = useCallback(async () => {
    try {
      const snapshot = await getDocs(collection(db, "config_faq"));
      if (!mountedRef.current) return;

      const items = snapshot.docs
        .map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Faq, "id">) }))
        .filter((faq) => isFilled(faq.pertanyaan) && isFilled(faq.jawaban));

      if (items.length === 0) {
        setStatus("empty");
        return;
      }
      setFaqs(items);
      setStatus("success");
    } catch (error) {
      console.error("Gagal memuat config_faq:", error);
      if (mountedRef.current) setStatus("error");
    }
  }, []);

  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  const handleRetry = useCallback(() => {
    setStatus("loading");
    fetchFaqs();
  }, [fetchFaqs]);

  const toggleFaq = useCallback((id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const groups = groupByKategori(faqs);

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
          onRetry={handleRetry}
        />
      )}
      {status === "empty" && <EmptyState message="Belum ada FAQ tersedia." />}
      {status === "success" && (
        <div className="flex flex-col gap-4">
          {groups.map((group) => (
            <Card
              key={group.kategori}
              title={group.kategori}
              icon={<QuestionMarkIcon />}
            >
              <div className="flex flex-col divide-y divide-foreground/10">
                {group.items.map((faq) => (
                  <AccordionItem
                    key={faq.id}
                    faq={faq}
                    isOpen={openIds.has(faq.id)}
                    onToggle={() => toggleFaq(faq.id)}
                  />
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}

function AccordionItem({
  faq,
  isOpen,
  onToggle,
}: {
  faq: Faq;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const panelId = `faq-jawaban-${faq.id}`;

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="flex w-full items-center justify-between gap-3 py-3 text-left text-sm font-medium text-foreground"
      >
        <span>{faq.pertanyaan}</span>
        <ChevronDownIcon
          className={`text-foreground/50 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div id={panelId} className="pb-3 text-sm leading-6 text-foreground/70">
          {faq.jawaban}
        </div>
      )}
    </div>
  );
}
