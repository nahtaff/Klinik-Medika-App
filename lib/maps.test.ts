import { describe, expect, it } from "vitest";
import { buildMapsLink } from "./maps";

const PIN_KLINIK = "https://maps.app.goo.gl/vwMayovP7h6qKtjS9";

describe("buildMapsLink", () => {
  it("memakai link_maps dari Console kalau ada", () => {
    expect(
      buildMapsLink({ link_maps: PIN_KLINIK, alamat: "Jl. Raya Transyogi" })
    ).toBe(PIN_KLINIK);
  });

  it("mencari nama klinik + alamat kalau link_maps kosong", () => {
    expect(
      buildMapsLink({
        nama_klinik: "Klinik Metro Medika",
        alamat: "Jl. Raya Transyogi No. 42, Cileungsi",
      })
    ).toBe(
      "https://www.google.com/maps/search/?api=1&query=Klinik%20Metro%20Medika%2C%20Jl.%20Raya%20Transyogi%20No.%2042%2C%20Cileungsi"
    );
  });

  it("menolak link_maps yang bukan https, lalu jatuh ke pencarian alamat", () => {
    // Field diisi manual di Console dan masuk ke href: javascript: tidak boleh lolos.
    expect(
      buildMapsLink({ link_maps: "javascript:alert(1)", alamat: "Cileungsi" })
    ).toBe("https://www.google.com/maps/search/?api=1&query=Cileungsi");
    expect(buildMapsLink({ link_maps: "bukan url", alamat: "Cileungsi" })).toBe(
      "https://www.google.com/maps/search/?api=1&query=Cileungsi"
    );
  });

  it("mengembalikan null kalau tidak ada link maupun alamat", () => {
    expect(buildMapsLink({ nama_klinik: "Klinik Metro Medika" })).toBeNull();
  });
});
