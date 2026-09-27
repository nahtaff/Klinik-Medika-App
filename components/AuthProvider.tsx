"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "firebase/auth";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  status: "loading",
});

// Sumber kebenaran sesi pasien, dipakai F3 (OTP login) dan F4 (gerbang
// akses rekam medis). Firebase Auth JS SDK persist sesi ke IndexedDB
// secara default, jadi status "authenticated" tetap bertahan lintas reload.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    // Dynamic import, jangan dikembalikan ke import statis: provider ini
    // ada di root layout, jadi `firebase/auth` akan ikut ter-bundle di
    // initial load semua halaman — termasuk Beranda yang hanya butuh Firestore.
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    void (async () => {
      const [{ onAuthStateChanged }, { auth }] = await Promise.all([
        import("firebase/auth"),
        import("@/lib/auth"),
      ]);
      // Unmount selagi modul diunduh — jangan subscribe, agar listener
      // tidak menggantung tanpa owners.
      if (cancelled) return;
      unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        setUser(firebaseUser);
        setStatus(firebaseUser ? "authenticated" : "unauthenticated");
      });
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, status }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
