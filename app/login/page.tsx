"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";
import { auth } from "@/lib/auth";
import { normalizeIndonesianPhone } from "@/lib/phone";
import { useAuth } from "@/components/AuthProvider";

type Step = "phone" | "otp";
type ActionStatus = "idle" | "loading";

const OTP_SEND_TIMEOUT_MS = 20000;

class TimeoutError extends Error {}

// signInWithPhoneNumber menunggu reCAPTCHA selesai, yang butuh script Google
// termuat & (untuk invisible reCAPTCHA) storage access pihak ketiga. Kalau itu
// gagal diam-diam (koneksi lambat, ad-blocker), promise-nya bisa menggantung
// tanpa pernah resolve/reject — timeout ini memastikan user tetap dapat error
// yang jelas, bukan tombol "Mengirim..." selamanya.
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new TimeoutError("Waktu pengiriman OTP habis")),
      ms
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

function mapAuthError(error: unknown): string {
  if (error instanceof TimeoutError) {
    return "Gagal memuat reCAPTCHA atau mengirim OTP. Periksa koneksi internet Anda dan coba lagi.";
  }
  const code = (error as { code?: string } | null)?.code;
  switch (code) {
    case "auth/invalid-phone-number":
      return "Nomor HP tidak valid.";
    case "auth/too-many-requests":
      return "Terlalu banyak percobaan dari perangkat ini. Coba lagi nanti.";
    case "auth/quota-exceeded":
      return "Kuota pengiriman OTP klinik sudah habis untuk saat ini. Coba lagi nanti.";
    case "auth/invalid-verification-code":
      return "Kode OTP salah. Periksa kembali kode yang dikirim.";
    case "auth/code-expired":
      return "Kode OTP sudah kedaluwarsa. Kirim ulang kode.";
    default:
      return "Terjadi kesalahan. Coba lagi.";
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { status: authStatus } = useAuth();

  const [step, setStep] = useState<Step>("phone");
  const [phoneInput, setPhoneInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [actionStatus, setActionStatus] = useState<ActionStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedPhone, setConfirmedPhone] = useState<string | null>(null);

  const confirmationResultRef = useRef<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      recaptchaVerifierRef.current?.clear();
      recaptchaVerifierRef.current = null;
    };
  }, []);

  // Sudah login (mis. buka /login lagi lewat back button) → tidak perlu ulang OTP.
  useEffect(() => {
    if (authStatus === "authenticated") {
      router.replace("/rekam-medis");
    }
  }, [authStatus, router]);

  const resetRecaptcha = useCallback(() => {
    recaptchaVerifierRef.current?.clear();
    recaptchaVerifierRef.current = null;
  }, []);

  const handleSendOtp = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      setErrorMessage(null);

      const normalized = normalizeIndonesianPhone(phoneInput);
      if (!normalized) {
        setErrorMessage(
          "Nomor HP tidak valid. Gunakan format 08xxxxxxxxxx atau +62xxxxxxxxxx."
        );
        return; // OTP tidak dikirim.
      }

      setActionStatus("loading");
      try {
        if (!recaptchaVerifierRef.current) {
          recaptchaVerifierRef.current = new RecaptchaVerifier(
            auth,
            "recaptcha-container",
            { size: "invisible" }
          );
        }
        const result = await withTimeout(
          signInWithPhoneNumber(auth, normalized, recaptchaVerifierRef.current),
          OTP_SEND_TIMEOUT_MS
        );
        if (!mountedRef.current) return;
        confirmationResultRef.current = result;
        setConfirmedPhone(normalized);
        setStep("otp");
        setActionStatus("idle");
      } catch (error) {
        if (!mountedRef.current) return;
        console.error("Gagal mengirim OTP:", error);
        setErrorMessage(mapAuthError(error));
        setActionStatus("idle");
        // Widget reCAPTCHA yang sudah dipakai butuh instance baru untuk retry.
        resetRecaptcha();
      }
    },
    [phoneInput, resetRecaptcha]
  );

  const handleVerifyOtp = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      setErrorMessage(null);

      const code = otpInput.trim();
      if (!/^\d{6}$/.test(code)) {
        setErrorMessage("Kode OTP harus 6 digit angka.");
        return;
      }
      if (!confirmationResultRef.current) {
        setErrorMessage("Sesi verifikasi tidak ditemukan. Kirim ulang OTP.");
        return;
      }

      setActionStatus("loading");
      try {
        await confirmationResultRef.current.confirm(code);
        if (!mountedRef.current) return;
        // onAuthStateChanged di AuthProvider akan set status "authenticated";
        // redirect eksplisit di sini supaya user tidak menunggu event async itu.
        router.replace("/rekam-medis");
      } catch (error) {
        if (!mountedRef.current) return;
        console.error("Verifikasi OTP gagal:", error);
        setErrorMessage(mapAuthError(error));
        setActionStatus("idle");
      }
    },
    [otpInput, router]
  );

  const handleGantiNomor = useCallback(() => {
    setStep("phone");
    setOtpInput("");
    setErrorMessage(null);
    confirmationResultRef.current = null;
    resetRecaptcha();
  }, [resetRecaptcha]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 py-6 sm:max-w-lg sm:px-6">
      <header>
        <h1 className="font-heading text-2xl font-bold text-primary">
          Masuk ke Rekam Medis
        </h1>
        <p className="mt-1 text-sm text-foreground/60">
          Verifikasi nomor HP Anda untuk melihat riwayat kunjungan.
        </p>
      </header>

      {step === "phone" && (
        <form
          onSubmit={handleSendOtp}
          className="flex flex-col gap-4 rounded-2xl border border-foreground/10 bg-white p-4 shadow-sm"
        >
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="phone"
              className="text-sm font-medium text-foreground"
            >
              Nomor HP
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="08xxxxxxxxxx"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              disabled={actionStatus === "loading"}
              className="rounded-xl border border-foreground/15 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
            />
            <p className="text-xs text-foreground/50">
              Format: 08xxxxxxxxxx atau +62xxxxxxxxxx
            </p>
          </div>

          {errorMessage && (
            <p role="alert" className="text-sm text-red-600">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={actionStatus === "loading"}
            className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {actionStatus === "loading" ? "Mengirim..." : "Kirim Kode OTP"}
          </button>
        </form>
      )}

      {step === "otp" && (
        <form
          onSubmit={handleVerifyOtp}
          className="flex flex-col gap-4 rounded-2xl border border-foreground/10 bg-white p-4 shadow-sm"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="otp" className="text-sm font-medium text-foreground">
              Kode OTP
            </label>
            <p className="text-xs text-foreground/50">
              Kode 6 digit dikirim via SMS ke {confirmedPhone}.
            </p>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="123456"
              value={otpInput}
              onChange={(e) =>
                setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              disabled={actionStatus === "loading"}
              className="rounded-xl border border-foreground/15 px-3 py-2.5 text-center text-lg tracking-[0.5em] text-foreground outline-none focus:border-primary"
            />
          </div>

          {errorMessage && (
            <p role="alert" className="text-sm text-red-600">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={actionStatus === "loading"}
            className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {actionStatus === "loading" ? "Memverifikasi..." : "Verifikasi"}
          </button>

          <button
            type="button"
            onClick={handleGantiNomor}
            disabled={actionStatus === "loading"}
            className="text-sm font-medium text-foreground/60 hover:text-primary"
          >
            Ganti nomor HP
          </button>
        </form>
      )}

      {/* Container reCAPTCHA (invisible) — jangan diubah jadi display:none,
          badge-nya dirender otomatis oleh script Google di pojok layar. */}
      <div id="recaptcha-container" />
    </main>
  );
}
