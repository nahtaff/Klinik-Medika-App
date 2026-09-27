"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MessagingResult } from "@/lib/messaging";

type UiState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "enabled"; token: string }
  | { kind: "info"; message: string };

function resultToState(result: MessagingResult): UiState {
  switch (result.status) {
    case "ok":
      return { kind: "enabled", token: result.token };
    case "unsupported":
      return {
        kind: "info",
        message: "Perangkat/browser ini tidak mendukung notifikasi.",
      };
    case "no-vapid-key":
      return {
        kind: "info",
        message: "Notifikasi belum dikonfigurasi (VAPID key belum diset).",
      };
    case "denied":
      return {
        kind: "info",
        message: "Izin notifikasi ditolak. Aktifkan lewat pengaturan browser.",
      };
    case "error":
      return { kind: "info", message: "Gagal mengaktifkan notifikasi." };
  }
}

export function NotificationSetup() {
  const [state, setState] = useState<UiState>({ kind: "idle" });
  // tracked separately from `Notification.permission` because that is not
  // reactive: a visitor who grants mid-session via handleEnable() would never
  // get a foreground listener if the effect below only read it on mount.
  const [granted, setGranted] = useState(
    () => typeof window !== "undefined" && Notification.permission === "granted"
  );
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // FCM tidak otomatis menampilkan notifikasi saat app di foreground —
  // jadi tampilkan sendiri di sini (background ditangani oleh SW FCM).
  //
  // `firebase/messaging` adalah SDK terberat dan tidak ada gunanya diunduh
  // sebelum ada izin, jadi dimuat lewat dynamic import dan baru setelah
  // permission granted (saat mount, atau setelah user menekan tombol).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!granted) return;

    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    void (async () => {
      const { onForegroundMessage } = await import("@/lib/messaging");
      const unsub = await onForegroundMessage((payload) => {
        const title = payload.notification?.title ?? "Klinik Metro Medika";
        const body = payload.notification?.body ?? "";
        if (Notification.permission === "granted") {
          new Notification(title, { body, icon: "/icons/icon-192.png" });
        }
      });
      if (cancelled) {
        unsub();
        return;
      }
      unsubscribe = unsub;
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [granted]);

  const handleEnable = useCallback(async () => {
    setState({ kind: "loading" });
    const { requestMessagingToken } = await import("@/lib/messaging");
    const result = await requestMessagingToken();
    if (!mountedRef.current) return;
    setState(resultToState(result));
    // The original code subscribed unconditionally, so subscribe whenever
    // permission ends up granted — not only when the token request itself
    // succeeded, since a previously-registered device can still be pushed to.
    if (Notification.permission === "granted") setGranted(true);
    if (result.status === "ok") {
      // Token dicetak agar bisa dipakai mengirim notifikasi uji dari
      // Firebase Console (Cloud Messaging > Send test message).
      console.log("FCM registration token:", result.token);
    }
  }, []);

  return (
    <section className="rounded-2xl border border-foreground/10 bg-white p-4 shadow-sm">
      <h3 className="font-heading text-sm font-semibold text-foreground">
        Notifikasi
      </h3>
      <p className="mt-1 text-sm text-foreground/60">
        Aktifkan notifikasi untuk menerima pengingat dari klinik.
      </p>

      {state.kind === "enabled" ? (
        <p className="mt-3 text-sm font-medium text-primary">
          Notifikasi aktif di perangkat ini.
        </p>
      ) : (
        <button
          type="button"
          onClick={handleEnable}
          disabled={state.kind === "loading"}
          className="mt-3 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {state.kind === "loading" ? "Memproses..." : "Aktifkan Notifikasi"}
        </button>
      )}

      {state.kind === "info" && (
        <p className="mt-2 text-xs text-foreground/50">{state.message}</p>
      )}
    </section>
  );
}
