import { describe, expect, it } from "vitest";
import { readCache, writeCache } from "./useLoad";

function fakeStorage(): Storage {
  const items = new Map<string, string>();
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => void items.set(key, value),
    removeItem: (key) => void items.delete(key),
    clear: () => items.clear(),
    key: (index) => [...items.keys()][index] ?? null,
    get length() {
      return items.size;
    },
  };
}

function throwingStorage(): Storage {
  const fail = () => {
    throw new DOMException("blocked", "SecurityError");
  };
  return { ...fakeStorage(), getItem: fail, setItem: fail };
}

describe("cache data publik untuk offline", () => {
  it("mengembalikan data yang terakhir disimpan", () => {
    const storage = fakeStorage();
    writeCache(storage, "contact_info", { alamat: "Jl. Merdeka 1" });
    expect(readCache(storage, "contact_info")).toEqual({
      alamat: "Jl. Merdeka 1",
    });
  });

  it("mengembalikan null kalau belum pernah disimpan", () => {
    expect(readCache(fakeStorage(), "faq")).toBeNull();
  });

  it("mengembalikan null kalau isi cache rusak", () => {
    const storage = fakeStorage();
    storage.setItem("klinik-cache:faq", "{bukan json");
    expect(readCache(storage, "faq")).toBeNull();
  });

  it("tidak crash kalau storage diblokir browser", () => {
    const storage = throwingStorage();
    expect(() => writeCache(storage, "faq", [1])).not.toThrow();
    expect(readCache(storage, "faq")).toBeNull();
  });

  it("tidak crash kalau storage tidak tersedia", () => {
    expect(readCache(undefined, "faq")).toBeNull();
    expect(() => writeCache(undefined, "faq", [1])).not.toThrow();
  });
});
