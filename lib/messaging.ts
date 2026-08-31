import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type MessagePayload,
} from "firebase/messaging";
import { app } from "@/lib/firebase";

export type MessagingResult =
  | { status: "ok"; token: string }
  | { status: "unsupported" }
  | { status: "no-vapid-key" }
  | { status: "denied" }
  | { status: "error"; message: string };

// Minta izin notifikasi lalu ambil FCM registration token. Token inilah yang
// dipakai server/Console untuk mengirim push ke perangkat ini. VAPID key
// (kunci publik Web Push) diambil dari env — lihat catatan di README/.env.
export async function requestMessagingToken(): Promise<MessagingResult> {
  if (typeof window === "undefined") return { status: "unsupported" };

  try {
    if (!(await isSupported())) return { status: "unsupported" };

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) return { status: "no-vapid-key" };

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return { status: "denied" };

    // Daftarkan SW khusus FCM (terpisah dari SW offline Serwist).
    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js"
    );

    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    return token
      ? { status: "ok", token }
      : { status: "error", message: "Token kosong" };
  } catch (error) {
    console.error("Gagal mengambil FCM token:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Kesalahan tidak dikenal",
    };
  }
}

// Handler pesan saat aplikasi sedang dibuka (foreground). Background message
// ditangani oleh firebase-messaging-sw.js.
export async function onForegroundMessage(
  callback: (payload: MessagePayload) => void
): Promise<() => void> {
  if (typeof window === "undefined" || !(await isSupported())) {
    return () => {};
  }
  const messaging = getMessaging(app);
  return onMessage(messaging, callback);
}
