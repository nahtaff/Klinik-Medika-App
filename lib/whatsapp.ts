export function buildWhatsAppLink(nomorWhatsapp: string, message?: string): string {
  const digits = nomorWhatsapp.replace(/\D/g, "");
  // wa.me menolak awalan 0; nomor klinik Indonesia: 0812... -> 62812...
  const nomor = digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
  return message
    ? `https://wa.me/${nomor}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${nomor}`;
}
