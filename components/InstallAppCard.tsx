"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { isIosBrowserTab, isStandaloneDisplay } from "@/lib/platform";
import { ShareIcon } from "@/components/icons";

// Dikirim Chrome/Edge (Android & desktop) saat app bisa dipasang; membawa
// dialog pasang bawaan browser. Belum ada di tipe DOM TypeScript.
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
}

// Disimpan di sessionStorage: "Nanti saja" berlaku sampai app/tab ditutup,
// bukan selamanya, jadi kartu muncul lagi saat app dibuka berikutnya.
const DISMISSED_KEY = "kartu-pasang-aplikasi-ditutup";

// Didengar sejak modul dimuat, bukan di useEffect: browser mengirim event ini
// sekali per pemuatan halaman, bisa sebelum kartu selesai dipasang.
let installEvent: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function setInstallEvent(event: BeforeInstallPromptEvent | null) {
  installEvent = event;
  listeners.forEach((listener) => listener());
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    // Tawaran bawaan Chrome ditahan supaya tidak dobel dengan kartu ini.
    event.preventDefault();
    setInstallEvent(event as BeforeInstallPromptEvent);
  });
  window.addEventListener("appinstalled", () => setInstallEvent(null));
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readDismissed(): boolean {
  try {
    return sessionStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function InstallAppCard() {
  const event = useSyncExternalStore(
    subscribe,
    () => installEvent,
    () => null
  );
  // null = kartu disembunyikan. Platform dan pilihan "Nanti saja" hanya bisa
  // dibaca di browser, jadi HTML dari server selalu tanpa kartu.
  // shortcut: Safari tidak bisa tahu app sudah ada di Layar Utama, jadi di tab
  // Safari kartu tetap tampil; "Nanti saja" menyembunyikannya sampai app ditutup.
  const [platform, setPlatform] = useState<"ios" | "other" | null>(null);
  // Safari tidak punya cara memasang app dari halaman web, jadi di iPhone
  // tombol Pasang membuka panduan langkah, bukan dialog instal.
  const [stepsOpen, setStepsOpen] = useState(false);

  useEffect(() => {
    const standalone = isStandaloneDisplay();
    if (standalone || readDismissed()) return;
    setPlatform(
      isIosBrowserTab(navigator.userAgent, navigator.maxTouchPoints, standalone)
        ? "ios"
        : "other"
    );
  }, []);

  // Selain iPhone/iPad, kartu hanya tampil kalau browser siap memasang.
  if (!platform || (platform === "other" && !event)) return null;

  const install = () => {
    if (!event) return;
    setInstallEvent(null); // satu event hanya bisa membuka dialog sekali
    event.prompt().catch((error) => {
      console.error("Gagal membuka dialog pasang aplikasi:", error);
    });
  };

  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Penyimpanan diblokir: kartu tetap ditutup sampai halaman dimuat ulang.
    }
    setPlatform(null);
  };

  return (
    <section className="rounded-2xl border border-foreground/10 bg-white p-4 shadow-sm">
      <h2 className="font-heading text-sm font-semibold text-foreground">
        Pasang Aplikasi
      </h2>
      <p className="mt-1 text-sm text-foreground/60">
        Buka Klinik Metro Medika langsung dari Layar Utama, seperti aplikasi
        biasa.
      </p>

      {stepsOpen && (
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-foreground/80">
          <li>
            Ketuk ikon{" "}
            <ShareIcon className="inline h-4 w-4 align-text-bottom text-primary" />{" "}
            <strong>Bagikan</strong>. Kalau tidak terlihat, ketuk dulu menu
            titik tiga (•••) di samping alamat web.
          </li>
          <li>
            Gulir daftarnya, lalu pilih <strong>Tambah ke Layar Utama</strong>.
          </li>
          <li>
            Ketuk <strong>Tambah</strong>. Ikon Metro Medika akan muncul di
            Layar Utama.
          </li>
        </ol>
      )}

      <div className="mt-3 flex items-center gap-4">
        <button
          type="button"
          onClick={platform === "ios" ? () => setStepsOpen((open) => !open) : install}
          aria-expanded={platform === "ios" ? stepsOpen : undefined}
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Pasang
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="py-2 text-sm font-medium text-foreground/60 hover:text-primary"
        >
          Nanti saja
        </button>
      </div>
    </section>
  );
}
