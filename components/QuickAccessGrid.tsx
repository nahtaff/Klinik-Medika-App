"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import {
  CalendarIcon,
  DocumentIcon,
  InfoIcon,
  QuestionMarkIcon,
} from "@/components/icons";

type QuickIcon = (props: { className?: string }) => React.ReactNode;

interface QuickItem {
  label: string;
  href: string;
  icon: QuickIcon;
  badge?: string;
}

// Grid highlight fitur di Beranda — melengkapi bottom navbar, bukan
// menggantikannya. Item "Tentang Klinik" mengarah ke section Informasi Klinik
// di halaman yang sama (anchor #informasi).
export function QuickAccessGrid() {
  const { status } = useAuth();
  const rekamHref = status === "authenticated" ? "/rekam-medis" : "/login";

  const items: QuickItem[] = [
    { label: "Jadwal Dokter", href: "/jadwal", icon: CalendarIcon },
    {
      label: "Rekam Medis",
      href: rekamHref,
      icon: DocumentIcon,
      badge: "Perlu Login",
    },
    { label: "FAQ Klinik", href: "/faq", icon: QuestionMarkIcon },
    { label: "Tentang Klinik", href: "#informasi", icon: InfoIcon },
  ];

  return (
    <section aria-labelledby="akses-cepat-heading">
      <h2
        id="akses-cepat-heading"
        className="mb-3 font-heading text-base font-semibold text-foreground"
      >
        Akses Cepat
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col items-start gap-3 rounded-2xl border border-foreground/10 bg-white p-4 shadow-sm transition-colors hover:border-primary/40"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <span className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-foreground">
                  {item.label}
                </span>
                {item.badge && (
                  <span className="w-fit rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                    {item.badge}
                  </span>
                )}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
