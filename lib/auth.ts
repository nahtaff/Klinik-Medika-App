// Auth dipisah dari lib/firebase.ts supaya halaman yang hanya butuh Firestore
// tidak ikut memuat `firebase/auth`. Hanya /login dan /rekam-medis (serta
// AuthProvider yang dipasang di kedua halaman itu) yang meng-import modul ini.
//
// Catatan: jangan import modul ini dari komponen di root layout atau halaman
// publik, karena itu menarik `firebase/auth` kembali ke semua halaman.
import { browserSessionPersistence, initializeAuth } from "firebase/auth";
import { app } from "@/lib/firebase";

// initializeAuth, bukan getAuth: getAuth ikut memasang login popup/redirect,
// yang di browser HP lebih dulu memuat apis.google.com + iframe firebaseapp.com
// (~1 detik) sebelum status login diketahui. App ini hanya memakai OTP.
//
// Sesi hanya hidup selama tab/app terbuka (sessionStorage), bukan selamanya:
// rekam medis tidak boleh tetap terbuka bagi orang berikutnya di HP yang
// dipakai bersama. Konsekuensinya pasien OTP ulang tiap membuka app.
export const auth = initializeAuth(app, {
  persistence: browserSessionPersistence,
});
