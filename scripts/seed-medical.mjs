// Skrip seed sekali-jalan untuk data rekam medis dummy. Pakai Admin SDK
// karena security rules Firestore mengunci semua write dari client SDK
// (allow write: if false untuk users & medical_records) — lihat CLAUDE.md.
//
// Cara pakai:
//   1. Pastikan serviceAccountKey.json ada di root project (sudah di-gitignore).
//   2. node scripts/seed-medical.mjs
//      (atau set FIREBASE_SERVICE_ACCOUNT_PATH ke lokasi lain)
//
// Data ini untuk development & testing, bukan rekam medis pasien sungguhan.

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serviceAccountPath =
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH ??
  path.resolve(__dirname, "../serviceAccountKey.json");

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));
} catch {
  console.error(
    `Service account key tidak ditemukan di: ${serviceAccountPath}\n\n` +
      "Unduh dari Firebase Console > Project Settings > Service accounts > " +
      "Generate new private key, simpan sebagai serviceAccountKey.json di root project,\n" +
      "atau set env FIREBASE_SERVICE_ACCOUNT_PATH ke lokasi file tersebut."
  );
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const UID = "wzWlvNWC1fSztqSstLIGVfs4Y2w2";
const DOKTER_ID = "dr-ahmad-fauzi";

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return Timestamp.fromDate(d);
}

async function seedUser() {
  await db.collection("users").doc(UID).set({
    nama: "Dimas Prasetyo",
    nomor_telepon: "+6281234567890",
    created_at: daysAgo(90),
    last_login: Timestamp.now(),
  });
  console.log(`✓ users/${UID} seeded`);
}

async function seedMedicalRecords() {
  const dokterRef = db.doc(`doctors/${DOKTER_ID}`);

  const records = [
    {
      id: "record-1",
      tanggal_kunjungan: daysAgo(85),
      keluhan: "Kontrol kesehatan rutin, tidak ada keluhan khusus.",
      diagnosis: "Sehat, tidak ditemukan kelainan.",
      resep_obat: "Vitamin C 500mg, 1x1 tablet sehari.",
      catatan: "Disarankan kontrol kembali dalam 6 bulan.",
    },
    {
      id: "record-2",
      tanggal_kunjungan: daysAgo(58),
      keluhan: "Demam 3 hari, batuk pilek, dan sakit tenggorokan.",
      diagnosis: "ISPA (Infeksi Saluran Pernapasan Atas).",
      resep_obat:
        "Paracetamol 500mg 3x1, Amoxicillin 500mg 3x1 (7 hari), OBH Combi sirup 3x1 sendok makan.",
      catatan:
        "Istirahat cukup dan perbanyak minum air putih. Kontrol kembali jika demam tidak turun dalam 3 hari.",
    },
    {
      id: "record-3",
      tanggal_kunjungan: daysAgo(30),
      keluhan: "Nyeri ulu hati dan mual, terutama setelah makan pedas.",
      diagnosis: "Gastritis (maag).",
      resep_obat:
        "Omeprazole 20mg 1x1 (sebelum makan), Antasida sirup 3x1 sendok makan.",
      catatan: "Hindari makanan pedas dan asam, serta makan secara teratur.",
    },
    {
      id: "record-4",
      tanggal_kunjungan: daysAgo(7),
      keluhan: "Kontrol setelah pengobatan maag, keluhan sudah membaik.",
      diagnosis: "Gastritis membaik, dalam pemantauan.",
      resep_obat: "Omeprazole 20mg 1x1, dilanjutkan 7 hari.",
      catatan: "Kondisi membaik. Lanjutkan pola makan teratur.",
    },
  ];

  const batch = db.batch();
  for (const { id, ...data } of records) {
    const ref = db
      .collection("users")
      .doc(UID)
      .collection("medical_records")
      .doc(id);
    batch.set(ref, { ...data, dokter_id: dokterRef });
  }
  await batch.commit();
  console.log(`✓ medical_records seeded (${records.length} dokumen)`);
}

async function main() {
  await seedUser();
  await seedMedicalRecords();
  console.log("\nSeed rekam medis dummy selesai.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed gagal:", err);
  process.exit(1);
});
