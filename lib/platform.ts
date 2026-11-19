// Safari di iPhone/iPad hanya memberi Notification API ke web app yang dibuka
// dari Layar Utama. iPadOS mengaku sebagai Mac di user agent, jadi dikenali
// dari layar sentuhnya (Mac tidak punya layar sentuh).
export function isIosBrowserTab(
  userAgent: string,
  maxTouchPoints: number,
  standalone: boolean
): boolean {
  const ios =
    /iPhone|iPad|iPod/.test(userAgent) ||
    (userAgent.includes("Macintosh") && maxTouchPoints > 1);
  return ios && !standalone;
}

// Hanya untuk dipanggil di browser.
export function isStandaloneDisplay(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}
