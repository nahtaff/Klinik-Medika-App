# Klinik Metro Medika

PWA layanan pasien untuk Klinik Metro Medika (satu klinik, satu dokter umum). Dibuat sebagai aplikasi skripsi dengan pendekatan User-Centered Design. Pasien bisa melihat informasi klinik, jadwal dokter, dan FAQ tanpa login, serta melihat riwayat rekam medisnya sendiri setelah verifikasi OTP.

## Fitur

| Kode | Fitur | Keterangan |
|---|---|---|
| F1 | Informasi Klinik | Alamat (dengan link Google Maps), kontak, jam operasional, status buka hari ini, layanan |
| F2 | Jadwal Dokter | Jadwal praktik per hari, status ketersediaan, janji temu lewat WhatsApp |
| F3 | Otentikasi OTP | Login dengan nomor HP (Firebase Phone Auth), sesi berakhir saat app ditutup |
| F4 | Rekam Medis | Riwayat kunjungan milik pasien yang login, hanya baca |
| F5 | FAQ + WhatsApp | FAQ per kategori, tombol WhatsApp di semua halaman |
| F6 | PWA | Bisa dipasang, halaman publik tetap berisi saat offline, notifikasi push (FCM) |

Booking online, input rekam medis, dan panel admin sengaja di luar cakupan. Data klinik, dokter, dan FAQ diubah langsung di Firebase Console.

## Teknologi

Next.js 16 (App Router) + TypeScript, Tailwind CSS 4, Firebase (Firestore Lite, Phone Auth, Storage, Cloud Messaging), Serwist untuk service worker, Vitest untuk unit test. Deploy di Vercel.

## Menjalankan secara lokal

Prasyarat: Node.js 22 dan akses ke project Firebase.

1. Pasang dependency:

   ```bash
   npm ci
   ```

2. Buat file `.env.local` di root project. Nilainya ada di Firebase Console > Project settings > General > Your apps (config web app). VAPID key ada di Project settings > Cloud Messaging > Web Push certificates.

   ```bash
   NEXT_PUBLIC_FIREBASE_API_KEY=
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
   NEXT_PUBLIC_FIREBASE_APP_ID=
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
   NEXT_PUBLIC_FIREBASE_VAPID_KEY=
   ```

   Tanpa `NEXT_PUBLIC_FIREBASE_VAPID_KEY`, aplikasi tetap jalan, hanya tombol notifikasi yang menampilkan pesan "belum dikonfigurasi".

3. Jalankan server development, lalu buka http://localhost:3000:

   ```bash
   npm run dev
   ```

   Service worker sengaja dimatikan saat development. Untuk menguji PWA dan offline, pakai build production: `npm run build && npm start`.

Untuk menguji login tanpa mengirim SMS sungguhan, daftarkan nomor uji di Firebase Console > Authentication > Sign-in method > Phone > Phone numbers for testing.

## Data awal (seed)

Script seed memakai Firebase Admin SDK karena security rules menolak semua write dari aplikasi.

1. Unduh kunci service account dari Firebase Console > Project settings > Service accounts > Generate new private key, simpan sebagai `serviceAccountKey.json` di root project. File ini sudah di-gitignore dan **tidak boleh di-commit**.
2. Jalankan:

   ```bash
   npm run seed          # contact_info, doctors, config_faq
   npm run seed:medical  # rekam medis dummy untuk pengujian
   ```

`npm run seed` **menimpa** dokumen yang sudah ada. Jangan jalankan ke project produksi kalau datanya sudah diubah lewat Console.

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Server development |
| `npm run build` | Build production (memakai webpack agar service worker ikut dibuat) |
| `npm start` | Menjalankan hasil build |
| `npm run lint` | Pemeriksaan ESLint |
| `npm test` | Unit test Vitest |

## Pengujian

Unit test ada di `lib/*.test.ts` dan menguji logika yang tidak bergantung pada Firebase: validasi nomor HP (F3), link WhatsApp dan Google Maps, penyusunan jadwal praktik dan nama hari, status buka hari ini, pengelompokan FAQ, cache data offline, dan deteksi Safari iOS untuk notifikasi.

## Struktur folder

```
app/          Halaman (Beranda, Jadwal, FAQ, Login, Rekam Medis), manifest, service worker
components/   Komponen UI bersama (navigasi, kartu, status loading/kosong/error, notifikasi)
lib/          Koneksi Firebase dan logika murni yang dites
scripts/      Script seed data
public/       Ikon PWA dan service worker FCM
```

## Keamanan

Rekam medis adalah data kesehatan pribadi. Aksesnya harus dikunci oleh Firestore Security Rules: pasien hanya boleh membaca `users/{uid}` dan `users/{uid}/medical_records` miliknya sendiri, dan semua write ditolak. Aturan yang wajib dipasang di Firebase Console ada di `CLAUDE.md`. Rekam medis juga tidak pernah disimpan di cache offline.

## Deploy

Hubungkan repository ke Vercel dan isi environment variable yang sama dengan `.env.local`. Setelah terhubung, setiap push ke `main` otomatis di-deploy.
