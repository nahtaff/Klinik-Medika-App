/* global importScripts, firebase */
// Service worker khusus FCM untuk menerima push saat aplikasi tidak aktif
// (background). File ini WAJIB berada di root (/firebase-messaging-sw.js) dan
// terpisah dari service worker offline (Serwist) — keduanya bisa hidup bersama.
//
// Config di bawah berisi identifier publik (sama dengan NEXT_PUBLIC_* di app),
// aman berada di file statis. File statis tidak bisa membaca process.env, jadi
// nilainya di-inline.
importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyDnXK4oIb_KtVNe-XTCQ7lHitAQpgbLcLQ",
  authDomain: "klinik-medika-f6e1c.firebaseapp.com",
  projectId: "klinik-medika-f6e1c",
  storageBucket: "klinik-medika-f6e1c.firebasestorage.app",
  messagingSenderId: "686555878010",
  appId: "1:686555878010:web:608b13232b2512519aa1c3",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  // Pesan dengan payload `notification` (mis. dari Firebase Console) sudah
  // ditampilkan otomatis oleh SDK sebelum handler ini dipanggil. Menampilkan
  // lagi di sini membuat notifikasi muncul dua kali, jadi hanya pesan
  // data-only yang ditangani di sini.
  if (payload.notification) return;

  self.registration.showNotification("Klinik Metro Medika", {
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
  });
});
