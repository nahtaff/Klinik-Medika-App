# CLAUDE.md — Klinik Medika App

Panduan kerja untuk Claude Code pada project ini. Baca sebelum menulis atau mereview kode.

---

## Konteks

Ini aplikasi skripsi: PWA manajemen layanan pasien untuk Klinik Metro Medika, satu klinik dengan satu dokter umum tetap. Aktor tunggal: Pasien. Dibangun dengan pendekatan User-Centered Design. Dokumen ini adalah sumber kebenaran untuk keputusan teknis.

**Stack (sudah final, jangan diganti):**
- Next.js (App Router) + TypeScript
- Tailwind CSS
- Firebase: Firestore, Phone Auth (OTP), Cloud Storage, Cloud Messaging (FCM)
- Deploy: Vercel

---

## Cara kerja yang diharapkan

- **Clean & maintainable.** Ikuti best practice React/Next.js. Kalau ada pilihan desain yang berdampak (server vs client component, struktur data, pola fetch), jelaskan trade-off-nya, jangan diam-diam pilih.
- **Jangan over-engineer.** Solusi paling sederhana yang benar-benar jalan. Stdlib atau fitur bawaan dulu sebelum nambah dependency. Satu baris sebelum lima puluh. Kalau ragu sebuah abstraksi perlu, berarti belum perlu.
- **Tanpa state manager global.** Ini 4 halaman read-mostly + OTP. Pakai React state (useState/useReducer) dan fetch langsung via Firebase SDK. Jangan pasang Redux/Zustand kecuali nanti benar-benar terbukti kurang.
- **Tantang asumsi.** Kalau ada yang salah atau berisiko di permintaan, bilang. Jelaskan alasan (WHY), bukan cuma hasil (WHAT). Koreksi lebih berguna daripada validasi.
- **Hormati scope.** Jangan bangun apa pun di luar daftar "Di luar cakupan". Kalau kepikiran fitur tambahan, tawarkan dulu, jangan langsung bikin.
- **Bahasa.** Komentar kode dan penamaan boleh Inggris. Teks UI yang dilihat pasien pakai Bahasa Indonesia.

## Review kode

Saat mereview: cek kesesuaian dengan acceptance criteria di bawah, keamanan (terutama akses rekam medis), penanganan empty state & error, dan apakah ada over-engineering yang bisa disederhanakan. Beri pushback langsung kalau ada yang off.

---

## Batasan (jangan dibangun)

Booking online, input rekam medis oleh dokter, dashboard admin/antrean, pembayaran, integrasi BPJS, telekonsultasi, panel manajemen konten, UI admin. Perubahan data (dokter, FAQ, info klinik) dilakukan langsung di Firebase Console. Booking janji temu didelegasikan ke WhatsApp. Tidak ada pemilihan dokter di manapun (klinik satu dokter).

---

## Data model (Firestore)

Tidak ada koleksi `appointments`.

```
users/{uid}                       # uid = Firebase Auth UID (dari OTP)
  nama: string
  nomor_telepon: string           # terverifikasi OTP
  created_at, last_login: timestamp

  medical_records/{recordId}      # SUBCOLLECTION, bukan koleksi datar
    tanggal_kunjungan: timestamp
    dokter_id: reference -> doctors
    keluhan, diagnosis, resep_obat, catatan: string

doctors/{doctorId}
  nama, spesialisasi: string
  foto_url: string
  jadwal_praktik: array<{ hari, jam_mulai, jam_selesai }>   # view-only

config_faq/{faqId}
  pertanyaan, jawaban, kategori: string
  urutan: number

contact_info/{docId}              # satu dokumen
  nama_klinik, alamat, nomor_whatsapp, nomor_telepon: string
  jam_operasional: map
```

`medical_records` jadi subcollection supaya security rule bisa mengunci akses langsung berdasarkan `uid`, tanpa query field relasi.

---

## Security Rules (WAJIB, jangan disederhanakan)

Rekam medis adalah data kesehatan pribadi. Tanpa rules ini, data pasien bisa dibaca siapa saja. Terapkan persis:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{uid} {
      allow read: if request.auth != null && request.auth.uid == uid;
      allow write: if false;
      match /medical_records/{recordId} {
        allow read: if request.auth != null && request.auth.uid == uid;
        allow write: if false;
      }
    }

    match /doctors/{doctorId}    { allow read: if true; allow write: if false; }
    match /config_faq/{faqId}    { allow read: if true; allow write: if false; }
    match /contact_info/{docId}  { allow read: if true; allow write: if false; }
  }
}
```

`allow write: if false` di semua koleksi karena pasien tidak menulis data apa pun. Semua perubahan lewat Console.

---

## Fitur & acceptance criteria

### F1. Informasi Klinik
Halaman menampilkan jam operasional, alamat, kontak, profil layanan dari `contact_info`.
- [ ] Semua field tampil; field kosong tidak dirender (bukan "undefined")
- [ ] Data dari Firestore, bukan hardcode

### F2. Jadwal Dokter
Menampilkan jadwal praktik satu dokter dari `doctors.jadwal_praktik`.
- [ ] Menampilkan nama, spesialisasi, foto, hari & jam praktik
- [ ] Status ketersediaan per hari (badge) berdasarkan `jadwal_praktik`
- [ ] TIDAK ada tombol booking. Ada baris "Hubungi via WhatsApp untuk janji temu" yang membuka WhatsApp
- [ ] `jadwal_praktik` kosong → empty state, bukan crash

### F3. Otentikasi OTP
Verifikasi nomor HP via Firebase Phone Auth sebelum buka rekam medis.
- [ ] Nomor tidak valid → error jelas, OTP tidak terkirim
- [ ] OTP salah → tolak, jangan buka rekam medis
- [ ] OTP benar → sesi aktif, arahkan ke rekam medis
- [ ] Sesi habis/logout → akses rekam medis diblokir lagi
- [ ] reCAPTCHA/rate limit bawaan Firebase tetap aktif, jangan dimatikan

### F4. Rekam Medis
Riwayat kunjungan pribadi, read-only, lini masa per tanggal. Hanya setelah OTP.
- [ ] Hanya menampilkan riwayat milik `uid` yang login, tidak pernah data pasien lain
- [ ] Tiap entri: tanggal, dokter, keluhan, diagnosis, resep, catatan
- [ ] Pasien tanpa riwayat → empty state, bukan error
- [ ] Tidak ada tombol tambah/edit/hapus

### F5. FAQ + WhatsApp
FAQ berkategori dari `config_faq`, accordion. Tombol WA mengambang di semua halaman.
- [ ] FAQ dikelompokkan per kategori, terurut `urutan`, dari Firestore
- [ ] Accordion buka/tutup
- [ ] Tombol WA membuka `wa.me/<nomor_whatsapp>` dari `contact_info`
- [ ] `config_faq` kosong → empty state

### F6. PWA
Installable, offline pada halaman utama, push notification.
- [ ] `manifest.json` valid (ikon 192 & 512, theme color, standalone) → installable
- [ ] Service worker: halaman utama (info, jadwal, FAQ) terbuka saat offline
- [ ] Rekam medis TIDAK di-cache offline (data sensitif)
- [ ] Perubahan jadwal & FAQ tampil tanpa install ulang
- [ ] Push notification diterima (FCM): minimal registrasi token + 1 notifikasi uji
- [ ] Offline pakai next-pwa atau Serwist, jangan tulis service worker dari nol

---

## Target non-fungsional

- Mobile-first, responsif
- Lighthouse: PWA ≥ 90, Performance ≥ 80, Accessibility ≥ 80
- Aksesibilitas dasar: kontras cukup, alt text, label form, urutan fokus wajar. Jangan diskip.

---

## Acuan visual

Mockup high-fidelity (Beranda + Jadwal) ada di folder `/design` (atau lihat lampiran skripsi). Warna utama teal `#0EA5A4`. Font Plus Jakarta Sans (heading) / Inter (body). Ikuti desain mockup untuk tampilan akhir.

---

## Catatan penting

- Empty state & error handling adalah bagian dari acceptance, bukan tambahan. Tiap fitur punya kondisi kosongnya.
- Data dummy dipakai untuk development & testing, bukan rekam medis pasien sungguhan.
- Jangan menyentuh reCAPTCHA/rate limit bawaan Firebase Phone Auth.
