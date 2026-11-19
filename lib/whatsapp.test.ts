import { describe, expect, it } from "vitest";
import { buildWhatsAppLink } from "./whatsapp";

describe("buildWhatsAppLink", () => {
  it("membuat link wa.me dari nomor format internasional", () => {
    expect(buildWhatsAppLink("6281234567890")).toBe(
      "https://wa.me/6281234567890"
    );
  });

  it("membuang +, spasi, dan tanda hubung", () => {
    expect(buildWhatsAppLink("+62 812-3456-7890")).toBe(
      "https://wa.me/6281234567890"
    );
  });

  it("mengubah nomor lokal berawalan 0 ke format 62", () => {
    // Nomor diketik manual di Firebase Console; wa.me menolak awalan 0.
    expect(buildWhatsAppLink("081234567890")).toBe(
      "https://wa.me/6281234567890"
    );
  });

  it("menyertakan pesan yang sudah di-encode", () => {
    expect(
      buildWhatsAppLink("6281234567890", "Halo, saya ingin membuat janji temu")
    ).toBe(
      "https://wa.me/6281234567890?text=Halo%2C%20saya%20ingin%20membuat%20janji%20temu"
    );
  });
});
