// Firestore sengaja dipisah dari lib/firebase.ts: file itu hanya memegang
// `firebase/app`. Kalau `getFirestore` ikut di sana, setiap import `db` ikut
// menarik `firebase/auth` (yang berat) ke initial load halaman yang tidak
// butuh login — lihat lib/auth.ts untuk sisi Auth.
// Pakai entrypoint `firebase/firestore/lite`: aplikasi ini hanya membaca
// (getDoc/getDocs satu kali, tanpa onSnapshot, tanpa persistence, tanpa
// transaksi), jadi tidak perlu mesenchymalkan query engine + IndexedDB
// persistence milik SDK penuh. Offline tetap ditangani service worker (F6).
import { getFirestore } from "firebase/firestore/lite";
import { app } from "@/lib/firebase";

export const db = getFirestore(app);
