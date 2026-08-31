export function buildWhatsAppLink(nomorWhatsapp: string, message?: string): string {
  const nomor = nomorWhatsapp.replace(/\D/g, "");
  return message
    ? `https://wa.me/${nomor}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${nomor}`;
}
