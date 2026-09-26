// Skrip seed sekali-jalan. Pakai Admin SDK karena security rules Firestore
// mengunci semua write dari client SDK (allow write: if false) — lihat CLAUDE.md.
//
// Cara pakai:
//   1. Firebase Console > Project Settings > Service accounts >
//      Generate new private key, simpan sebagai serviceAccountKey.json
//      di root project (sudah di-gitignore).
//   2. node scripts/seed.mjs
//      (atau set FIREBASE_SERVICE_ACCOUNT_PATH ke lokasi lain)

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

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

async function seedContactInfo() {
  await db.collection("contact_info").doc("main").set({
    nama_klinik: "Klinik Metro Medika",
    alamat:
      "Ruko PTM I No. 42, JL Raya Alternatif Transyogi, Cileungsi, Perum Metland Transyogi, Bogor, Jawa Barat, Indonesia",
    nomor_whatsapp: "6281234567890",
    nomor_telepon: "021-89231234",
    jam_operasional: {
      senin: "08:00 - 17:00",
      selasa: "08:00 - 17:00",
      rabu: "08:00 - 17:00",
      kamis: "08:00 - 17:00",
      jumat: "08:00 - 17:00",
      sabtu: "08:00 - 17:00",
      minggu: "Tutup",
    },
    // Profil layanan klinik (tanpa tarif/harga).
    layanan: [
      "Konsultasi Dokter Umum",
      "Pemeriksaan Kesehatan Umum",
      "Surat Keterangan Sehat",
      "Pemeriksaan Tekanan Darah",
      "Pengobatan Penyakit Ringan",
      "Vaksinasi & Imunisasi",
    ],
  });
  console.log("✓ contact_info seeded");
}

async function seedDoctor() {
  const hariPraktik = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  await db.collection("doctors").doc("dr-ahmad-fauzi").set({
    nama: "dr. Ahmad Fauzi",
    spesialisasi: "Dokter Umum",
    foto_url: "",
    jadwal_praktik: hariPraktik.map((hari) => ({
      hari,
      jam_mulai: "08:00",
      jam_selesai: "17:00",
    })),
  });
  console.log("✓ doctors seeded");
}

async function seedFaq() {
  const faqs = [
    {
      pertanyaan: "Bagaimana cara membuat janji temu dengan dokter?",
      jawaban:
        "Janji temu dilakukan melalui WhatsApp. Tekan tombol WhatsApp di aplikasi untuk menghubungi klinik langsung.",
      kategori: "Janji Temu",
      urutan: 1,
    },
    {
      pertanyaan: "Apa saja jam operasional klinik?",
      jawaban:
        "Klinik buka Senin-Sabtu pukul 08.00-17.00 WIB, tutup pada hari Minggu.",
      kategori: "Layanan",
      urutan: 2,
    },
    {
      pertanyaan: "Bagaimana cara melihat rekam medis saya?",
      jawaban:
        "Verifikasi nomor HP Anda melalui OTP pada halaman Rekam Medis untuk melihat riwayat kunjungan Anda.",
      kategori: "Rekam Medis",
      urutan: 3,
    },
    {
      pertanyaan: "Apakah klinik menerima BPJS?",
      jawaban:
        "Saat ini klinik belum menerima BPJS. Pembayaran dilakukan secara mandiri di tempat.",
      kategori: "Pembayaran",
      urutan: 4,
    },
    {
      pertanyaan: "Apakah saya bisa memilih dokter tertentu?",
      jawaban:
        "Klinik ini memiliki satu dokter umum tetap, sehingga tidak ada pemilihan dokter.",
      kategori: "Layanan",
      urutan: 5,
    },
  ];

  const batch = db.batch();
  faqs.forEach((faq, i) => {
    const ref = db.collection("config_faq").doc(`faq-${i + 1}`);
    batch.set(ref, faq);
  });
  await batch.commit();
  console.log("✓ config_faq seeded (5 dokumen)");
}

async function main() {
  await seedContactInfo();
  await seedDoctor();
  await seedFaq();
  console.log("\nSeed selesai. medical_records sengaja tidak diisi.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed gagal:", err);
  process.exit(1);
});
