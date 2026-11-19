"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/auth";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  status: "loading",
});

// Sumber kebenaran sesi pasien untuk F3 (login OTP) dan F4 (gerbang rekam
// medis). Hanya dipasang di /login dan /rekam-medis, supaya firebase/auth
// tidak ikut dimuat di halaman publik. Sesi disimpan di sessionStorage
// (lihat lib/auth.ts): bertahan lintas reload, hilang saat tab/app ditutup.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(
    () =>
      onAuthStateChanged(auth, (firebaseUser) => {
        setUser(firebaseUser);
        setStatus(firebaseUser ? "authenticated" : "unauthenticated");
      }),
    []
  );

  return (
    <AuthContext.Provider value={{ user, status }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
