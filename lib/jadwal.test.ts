import { describe, expect, it } from "vitest";
import { groupJadwalByHari } from "./jadwal";

describe("groupJadwalByHari", () => {
  it("menyimpan dua sesi praktik di hari yang sama", () => {
    const jadwal = groupJadwalByHari([
      { hari: "Senin", jam_mulai: "08:00", jam_selesai: "12:00" },
      { hari: "Senin", jam_mulai: "17:00", jam_selesai: "20:00" },
    ]);
    expect(jadwal.get("senin")).toEqual([
      { jam_mulai: "08:00", jam_selesai: "12:00" },
      { jam_mulai: "17:00", jam_selesai: "20:00" },
    ]);
  });

  it("mengenali variasi penulisan nama hari", () => {
    const jadwal = groupJadwalByHari([
      { hari: "Jum'at", jam_mulai: "08:00", jam_selesai: "11:00" },
    ]);
    expect(jadwal.get("jumat")).toEqual([
      { jam_mulai: "08:00", jam_selesai: "11:00" },
    ]);
  });

  it("melewati entri yang tidak lengkap atau harinya tidak dikenal", () => {
    const jadwal = groupJadwalByHari([
      { hari: "Selasa", jam_mulai: "08:00" },
      { hari: "Rabu", jam_mulai: " ", jam_selesai: "12:00" },
      { hari: "Ahad", jam_mulai: "08:00", jam_selesai: "12:00" },
      null,
    ]);
    expect(jadwal.size).toBe(0);
  });

  it("mengembalikan jadwal kosong kalau data tidak ada", () => {
    expect(groupJadwalByHari(undefined).size).toBe(0);
  });
});
