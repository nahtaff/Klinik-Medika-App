// Header global: logo + nama klinik. Sengaja TANPA ikon/avatar profil di
// kanan (aplikasi single-actor pasien, tidak ada menu akun di header).
export function TopBar() {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-2.5 border-b border-foreground/10 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
      <span
        aria-hidden="true"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <rect x="10" y="4" width="4" height="16" rx="1" />
          <rect x="4" y="10" width="16" height="4" rx="1" />
        </svg>
      </span>
      <span className="font-heading text-base font-bold text-foreground">
        Klinik Metro Medika
      </span>
    </header>
  );
}
