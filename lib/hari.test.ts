import { afterEach, describe, expect, it, vi } from "vitest";
import { hariIniKey, mapByHari, normalizeHari } from "./hari";

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

  it("memetakan hari Minggu (getDay 0) ke minggu", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 22, 12)); // Minggu, 22 Nov 2026
    expect(hariIniKey()).toBe("minggu");
  });

  it("memetakan hari Senin ke senin", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 23, 12)); // Senin, 23 Nov 2026
    expect(hariIniKey()).toBe("senin");
  });
});
