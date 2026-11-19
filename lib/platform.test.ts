import { describe, expect, it } from "vitest";
import { isIosBrowserTab } from "./platform";

const IPHONE_SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1";
// iPadOS mengaku sebagai Mac; yang membedakan hanya layar sentuhnya.
const IPAD_OR_MAC_SAFARI =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15";
const ANDROID_CHROME =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36";

describe("isIosBrowserTab", () => {
  it("mengenali Safari iPhone yang belum dibuka dari Layar Utama", () => {
    expect(isIosBrowserTab(IPHONE_SAFARI, 5, false)).toBe(true);
  });

  it("mengenali iPad walau user agent-nya mengaku Mac", () => {
    expect(isIosBrowserTab(IPAD_OR_MAC_SAFARI, 5, false)).toBe(true);
  });

  it("tidak berlaku kalau app sudah dibuka dari Layar Utama", () => {
    expect(isIosBrowserTab(IPHONE_SAFARI, 5, true)).toBe(false);
  });

  it("tidak berlaku untuk Mac tanpa layar sentuh dan Android", () => {
    expect(isIosBrowserTab(IPAD_OR_MAC_SAFARI, 0, false)).toBe(false);
    expect(isIosBrowserTab(ANDROID_CHROME, 5, false)).toBe(false);
  });
});
