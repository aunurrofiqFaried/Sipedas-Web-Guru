"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ClipboardCheck,
  BookOpen,
  House,
  LogOut,
  Table2,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import type { User } from "@/lib/session";

const menu = [
  { href: "/", label: "Beranda", icon: House, mobile: true },
  { href: "/absensi", label: "Absensi", icon: ClipboardCheck, mobile: true },
  { href: "/jurnal", label: "Jurnal", icon: BookOpen, mobile: true },
  { href: "/poin", label: "Poin", icon: TriangleAlert, mobile: true },
  { href: "/rekap", label: "Rekap", icon: Table2, mobile: false },
  { href: "/profil", label: "Profil", icon: UserRound, mobile: true },
];

const labelRole: Record<string, string> = {
  admin: "Admin",
  guru: "Guru",
  guru_bk: "Guru BK",
  kesiswaan: "Waka Kesiswaan",
  kepala_sekolah: "Kepala Sekolah",
  staf: "Staf",
};

export default function Shell({ user, children }: { user: User; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const aktif = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  async function keluar() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_95%_4%,rgba(249,115,22,0.20),transparent_45%),radial-gradient(circle_at_4%_96%,rgba(22,163,74,0.18),transparent_45%),linear-gradient(180deg,#fff,#fff7ed_55%,#fff)] bg-fixed">
      {/* Menu samping: layar lebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-white/70 bg-white/70 p-4 backdrop-blur-xl md:flex">
        <div className="px-3 pb-6 pt-2">
          <p className="text-2xl font-bold text-orange-600">Sipedas</p>
          <p className="text-sm text-gray-500">Portal guru</p>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {menu.map(({ href, label, icon: Ikon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors ${
                aktif(href) ? "bg-orange-100 text-orange-700" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Ikon className="size-5" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="rounded-2xl border border-white/80 bg-white/80 p-3">
          <p className="truncate text-sm font-semibold">{user.name}</p>
          <p className="truncate text-xs text-gray-500">
            {labelRole[user.role] ?? user.role}
            {user.is_wali_kelas ? " · wali kelas" : ""}
          </p>
          <button
            onClick={keluar}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut className="size-4" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Isi halaman */}
      <div className="md:pl-64">
        <div className="mx-auto max-w-5xl px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] md:px-8 md:pb-10 md:pt-8">
          {children}
        </div>
      </div>

      {/* Menu bawah: HP */}
      <nav className="fixed inset-x-4 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-20 flex gap-1 rounded-[1.75rem] border border-white/90 bg-white/85 p-1.5 shadow-xl shadow-black/10 backdrop-blur-xl md:hidden">
        {menu
          .filter((m) => m.mobile)
          .map(({ href, label, icon: Ikon }) => (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-3xl py-2 text-[11px] font-medium transition-colors ${
                aktif(href) ? "bg-orange-100 font-bold text-orange-700" : "text-gray-500"
              }`}
            >
              <Ikon className="size-6" />
              {label}
            </Link>
          ))}
      </nav>
    </div>
  );
}