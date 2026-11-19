import { describe, expect, it } from "vitest";
import { groupByKategori } from "./faq";

describe("groupByKategori", () => {
  it("mengelompokkan per kategori, terurut berdasarkan urutan", () => {
    const groups = groupByKategori([
      { id: "c", kategori: "Layanan", urutan: 3 },
      { id: "a", kategori: "Umum", urutan: 1 },
      { id: "b", kategori: "Layanan", urutan: 2 },
    ]);
    expect(groups.map((g) => g.kategori)).toEqual(["Umum", "Layanan"]);
    expect(groups[1].items.map((f) => f.id)).toEqual(["b", "c"]);
  });

  it("menaruh FAQ tanpa urutan di akhir", () => {
    const groups = groupByKategori([
      { id: "tanpa-urutan", kategori: "Umum" },
      { id: "pertama", kategori: "Umum", urutan: 1 },
    ]);
    expect(groups[0].items.map((f) => f.id)).toEqual(["pertama", "tanpa-urutan"]);
  });

  it("memasukkan FAQ tanpa kategori ke Lainnya", () => {
    const groups = groupByKategori([{ id: "x", kategori: "  " }]);
    expect(groups).toEqual([
      { kategori: "Lainnya", items: [{ id: "x", kategori: "  " }] },
    ]);
  });
});
