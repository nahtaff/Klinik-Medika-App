"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import {
  CalendarIcon,
  DocumentIcon,
  HomeIcon,
  QuestionMarkIcon,
} from "@/components/icons";

type NavIcon = (props: { className?: string }) => React.ReactNode;

interface NavItem {
  label: string;
  href: string;
  icon: NavIcon;
  isActive: (pathname: string) => boolean;
}

export function BottomNav() {
  const pathname = usePathname();
  const { status } = useAuth();

  // Rekam Medis di balik OTP: kalau belum login, arahkan langsung ke gerbang
  // /login (RequireAuth juga akan menolak akses langsung). Item tetap ditandai
  // aktif baik di /rekam-medis maupun /login.
  const rekamHref = status === "authenticated" ? "/rekam-medis" : "/login";

  const items: NavItem[] = [
    {
      label: "Beranda",
      href: "/",
      icon: HomeIcon,
      isActive: (p) => p === "/",
    },
    {
      label: "Jadwal",
      href: "/jadwal",
      icon: CalendarIcon,
      isActive: (p) => p.startsWith("/jadwal"),
    },
    {
      label: "Rekam Medis",
      href: rekamHref,
      icon: DocumentIcon,
      isActive: (p) => p.startsWith("/rekam-medis") || p.startsWith("/login"),
    },
    {
      label: "FAQ",
      href: "/faq",
      icon: QuestionMarkIcon,
      isActive: (p) => p.startsWith("/faq"),
    },
  ];

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-foreground/10 bg-white pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around">
        {items.map((item) => {
          const active = item.isActive(pathname);
          const Icon = item.icon;
          return (
            <li key={item.label} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                  active
                    ? "text-primary"
                    : "text-foreground/50 hover:text-foreground/80"
                }`}
              >
                <Icon className="h-6 w-6" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
