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

    // Sengaja tanpa `serviceWorkerRegistration`: SDK lalu mendaftarkan sendiri
    // /firebase-messaging-sw.js di scope "/firebase-cloud-messaging-push-scope"
    // dan menunggu worker-nya aktif sebelum subscribe push. Jangan daftarkan
    // di scope default "/": scope itu milik SW Serwist (/sw.js), dan satu
    // scope hanya punya satu registrasi, jadi keduanya akan saling menimpa.
    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey });

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
