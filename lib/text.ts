// Data diisi manual di Firebase Console: string kosong atau spasi saja
// dianggap tidak ada, supaya tidak dirender sebagai field kosong.
export function isFilled(value: string | undefined | null): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
