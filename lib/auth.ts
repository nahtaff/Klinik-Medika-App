// Auth dipisah dari lib/firebase.ts supaya halaman yang hanya butuh Firestore
// tidak ikut memuat `firebase/auth`. Modul ini di-import statis oleh
// /login dan /rekam-medis (halaman yang memang butuh sesi), sedangkan
// AuthProvider — yang dirender di root layout, jadi ada di SEMUA halaman —
// memuat modul ini lewat dynamic import. Hasilnya `firebase/auth` tidak lagi
// ikut di initial load Beranda.
//
// Catatan: modul ini tidak boleh di-import dari komponen yang aktif di
// Beranda, karena itu akan menariknya kembali ke initial load.
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
