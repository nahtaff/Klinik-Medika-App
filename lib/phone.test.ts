import { describe, expect, it } from "vitest";
import { normalizeIndonesianPhone } from "./phone";

// F3: nomor tidak valid harus ditolak sebelum OTP dikirim.
describe("normalizeIndonesianPhone", () => {
  it.each([
    ["081234567890", "format lokal 08"],
    ["+6281234567890", "format +62"],
    ["6281234567890", "format 62 tanpa +"],
    ["0812-3456-7890", "dengan tanda hubung"],
    [" 0812 3456 7890 ", "dengan spasi"],
  ])("menerima %s (%s) sebagai +6281234567890", (input) => {
    expect(normalizeIndonesianPhone(input)).toBe("+6281234567890");
  });

  it.each([
    ["", "kosong"],
    ["abc", "huruf"],
    ["08123", "terlalu pendek"],
    ["0812345678901234", "terlalu panjang"],
    ["0215551234", "nomor telepon rumah (bukan seluler)"],
    ["81234567890", "tanpa awalan 0 atau 62"],
  ])("menolak %s (%s)", (input) => {
    expect(normalizeIndonesianPhone(input)).toBeNull();
  });
});
