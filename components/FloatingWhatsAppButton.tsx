"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { collection, getDocs, limit, query } from "firebase/firestore/lite";
import { db } from "@/lib/firestore";
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
  // Padding kiri/kanan tetap interpretar viewport (bukan container konten),
  // supaya di layar lebar tombol nempel di pojok kanan bawah, bukan melayang
  // jauh di tengah halaman.
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-end px-5 md:px-6">
      <a
        href={buildWhatsAppLink(nomorWhatsapp)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Hubungi kami via WhatsApp"
        className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105"
      >
        <WhatsAppIcon className="h-7 w-7" />
      </a>
    </div>
  );
}
