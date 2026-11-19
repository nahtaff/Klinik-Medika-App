// Firestore sengaja dipisah dari lib/firebase.ts: file itu hanya memegang
// `firebase/app`. Kalau `getFirestore` ikut di sana, setiap import `db` ikut
// menarik `firebase/auth` (yang berat) ke initial load halaman yang tidak
// butuh login — lihat lib/auth.ts untuk sisi Auth.
// Pakai entrypoint `firebase/firestore/lite`: aplikasi ini hanya membaca
// (getDoc/getDocs satu kali, tanpa onSnapshot, tanpa persistence, tanpa
// transaksi), jadi tidak perlu memuat query engine + IndexedDB persistence
// milik SDK penuh. Halaman publik membaca Firestore di server (ISR), jadi saat
// offline (F6) halaman yang disimpan service worker sudah berisi data.
import {
  collection,
  getDocs,
  getFirestore,
  limit,
  query,
} from "firebase/firestore/lite";
import { app } from "@/lib/firebase";

export const db = getFirestore(app);

export interface ContactInfo {
  nama_klinik?: string;
  alamat?: string;
  // opsional: link "Bagikan" pin klinik dari Google Maps
  link_maps?: string;
  nomor_whatsapp?: string;
  nomor_telepon?: string;
  jam_operasional?: Record<string, string>;
  layanan?: string[];
}

// Dipakai di server: root layout (tombol WhatsApp), Beranda, dan Jadwal.
export async function loadContactInfo(): Promise<ContactInfo | null> {
  const snapshot = await getDocs(
    query(collection(db, "contact_info"), limit(1))
  );
  return snapshot.empty ? null : (snapshot.docs[0].data() as ContactInfo);
}
