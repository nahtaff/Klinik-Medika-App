export interface Faq {
  id: string;
  pertanyaan?: string;
  jawaban?: string;
  kategori?: string;
  urutan?: number;
}

export interface FaqGroup {
  kategori: string;
  items: Faq[];
}

// Urut berdasarkan `urutan` (yang kosong di akhir), lalu kelompokkan per
// kategori. Urutan kategori mengikuti FAQ pertama di kategori tsb.
export function groupByKategori(faqs: Faq[]): FaqGroup[] {
  const sorted = faqs.toSorted(
    (a, b) =>
      (a.urutan ?? Number.MAX_SAFE_INTEGER) -
      (b.urutan ?? Number.MAX_SAFE_INTEGER)
  );

  const groups: FaqGroup[] = [];
  const indexByKategori = new Map<string, number>();

  for (const faq of sorted) {
    const kategori = faq.kategori?.trim() ? faq.kategori : "Lainnya";
    let index = indexByKategori.get(kategori);
    if (index === undefined) {
      index = groups.length;
      indexByKategori.set(kategori, index);
      groups.push({ kategori, items: [] });
    }
    groups[index].items.push(faq);
  }

  return groups;
}
