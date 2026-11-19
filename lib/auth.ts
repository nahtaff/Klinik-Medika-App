// Auth dipisah dari lib/firebase.ts supaya halaman yang hanya butuh Firestore
// tidak ikut memuat `firebase/auth`. Hanya /login dan /rekam-medis (serta
// AuthProvider yang dipasang di kedua halaman itu) yang meng-import modul ini.
//
// Catatan: jangan import modul ini dari komponen di root layout atau halaman
// publik, karena itu menarik `firebase/auth` kembali ke semua halaman.
import { browserSessionPersistence, getAuth, setPersistence } from "firebase/auth";
import { app } from "@/lib/firebase";

export const auth = getAuth(app);

// Sesi hanya hidup selama tab/app terbuka (sessionStorage), bukan selamanya
// (default IndexedDB): rekam medis tidak boleh tetap terbuka bagi orang
// berikutnya di HP yang dipakai bersama. Konsekuensinya pasien OTP ulang
// tiap membuka app. Sesi lama di IndexedDB ikut dipindahkan, tidak hilang.
if (typeof window !== "undefined") {
  setPersistence(auth, browserSessionPersistence).catch((error) => {
    console.error("Gagal mengatur masa berlaku sesi:", error);
  });
}
