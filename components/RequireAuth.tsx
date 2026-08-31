"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

// Bungkus halaman yang butuh sesi OTP aktif (mis. Rekam Medis / F4).
// Session habis atau logout → status jadi "unauthenticated" lewat
// onAuthStateChanged di AuthProvider, efek di bawah langsung mengusir
// ke /login sehingga akses tidak pernah "nyangkut" terbuka.
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 px-4 py-6 text-center sm:max-w-lg sm:px-6">
        <p className="text-sm text-foreground/60">Memeriksa sesi...</p>
      </main>
    );
  }

  return <>{children}</>;
}
