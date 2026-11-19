import { afterEach, describe, expect, it, vi } from "vitest";
import { hariIniKey, mapByHari, normalizeHari, statusHariIni } from "./hari";

describe("normalizeHari", () => {
  it("menerima nama hari dengan huruf besar dan spasi", () => {
    expect(normalizeHari("Senin")).toBe("senin");
    expect(normalizeHari(" JUMAT ")).toBe("jumat");
  });

  it("menerima ejaan Jum'at", () => {
    expect(normalizeHari("Jum'at")).toBe("jumat");
  });

  it("menolak teks yang bukan nama hari", () => {
    expect(normalizeHari("Ahad")).toBeNull();
    expect(normalizeHari("")).toBeNull();
  });
});

describe("mapByHari", () => {
  it("mencocokkan kunci jam operasional apa pun penulisannya", () => {
    const jam = mapByHari({ Senin: "08:00 - 17:00", "Jum'at": "08:00 - 11:00" });
    expect(jam.get("senin")).toBe("08:00 - 17:00");
    expect(jam.get("jumat")).toBe("08:00 - 11:00");
  });

  it("melewati jam kosong dan kunci yang bukan nama hari", () => {
    const jam = mapByHari({ selasa: "  ", catatan: "Libur nasional tutup" });
    expect(jam.size).toBe(0);
  });

  it("mengembalikan map kosong kalau data tidak ada", () => {
    expect(mapByHari(undefined).size).toBe(0);
  });
});

describe("hariIniKey", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("memetakan hari Minggu ke minggu", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-22T12:00:00+07:00")); // Minggu siang WIB
    expect(hariIniKey()).toBe("minggu");
  });

  it("memetakan hari Senin ke senin", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-23T12:00:00+07:00")); // Senin siang WIB
    expect(hariIniKey()).toBe("senin");
  });

  it("memakai hari di WIB, bukan zona waktu server", () => {
    // Server Vercel berjalan di UTC: Minggu 20:00 UTC sudah Senin 03:00 WIB.
    vi.useFakeTimers();
    vi.setSystemTime(new Date(Date.UTC(2026, 10, 22, 20)));
    expect(hariIniKey()).toBe("senin");
  });
});

describe("statusHariIni", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const jamOperasional = { Senin: "08:00 - 17:00", Selasa: "08:00 - 17:00" };

  it("menampilkan jam buka kalau hari ini ada di jadwal", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-23T12:00:00+07:00")); // Senin siang WIB
    expect(statusHariIni(jamOperasional)).toBe("Hari ini buka, 08:00 - 17:00");
  });

  it("menyatakan tutup kalau hari ini tidak ada di jadwal", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-22T12:00:00+07:00")); // Minggu siang WIB
    expect(statusHariIni(jamOperasional)).toBe("Hari ini tutup");
  });

  it("tidak menebak status kalau jam operasional belum diisi", () => {
    expect(statusHariIni(undefined)).toBeNull();
    expect(statusHariIni({})).toBeNull();
  });
});
