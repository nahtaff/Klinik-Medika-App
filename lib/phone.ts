// Firebase Phone Auth butuh format E.164 (+62...). Pasien biasanya
// mengetik format lokal (08xx) — normalisasi & validasi di sini supaya
// nomor yang jelas-jelas salah tidak sampai memicu pengiriman OTP.
export function normalizeIndonesianPhone(input: string): string | null {
  const digitsOnly = input.trim().replace(/[^\d+]/g, "");

  let national: string;
  if (digitsOnly.startsWith("+62")) {
    national = digitsOnly.slice(3);
  } else if (digitsOnly.startsWith("62")) {
    national = digitsOnly.slice(2);
  } else if (digitsOnly.startsWith("0")) {
    national = digitsOnly.slice(1);
  } else {
    return null;
  }

  // Nomor seluler Indonesia: diawali 8, total 9-13 digit signifikan.
  if (!/^8\d{7,11}$/.test(national)) {
    return null;
  }

  return `+62${national}`;
}
