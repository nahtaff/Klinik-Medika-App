"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { WhatsAppIcon } from "@/components/icons";
import { buildWhatsAppLink } from "@/lib/whatsapp";

function isFilled(value: string | undefined | null): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

// Muncul di semua halaman (dirender dari root layout). Kalau nomor
// WhatsApp belum ada / gagal dimuat, tombol cukup tidak muncul —
// ini elemen pelengkap, bukan konten inti yang butuh error/empty state.
export default function FloatingWhatsAppButton() {
  const [nomorWhatsapp, setNomorWhatsapp] = useState<string | undefined>(
    undefined
  );
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchNomorWhatsapp = useCallback(async () => {
    try {
      const snapshot = await getDocs(
        query(collection(db, "contact_info"), limit(1))
      );
      if (!mountedRef.current || snapshot.empty) return;
      const contact = snapshot.docs[0].data() as { nomor_whatsapp?: string };
      setNomorWhatsapp(contact.nomor_whatsapp);
    } catch (error) {
      console.error("Gagal memuat nomor WhatsApp:", error);
    }
  }, []);

  useEffect(() => {
    fetchNomorWhatsapp();
  }, [fetchNomorWhatsapp]);

  if (!isFilled(nomorWhatsapp)) return null;

  // bottom-24 supaya mengambang di atas bottom navbar, tidak bertabrakan.
  return (
    <a
      href={buildWhatsAppLink(nomorWhatsapp)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Hubungi kami via WhatsApp"
      className="fixed bottom-24 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  );
}
