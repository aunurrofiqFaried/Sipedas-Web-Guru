"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  House,
  LogOut,
  Table2,
  TriangleAlert,
  UserRound,
  LayoutDashboard,
} from "lucide-react";
import { api } from "@/lib/api-client";
import type { User } from "@/lib/session";
import type { PengumumanResponse } from "@/lib/types";
import { PERAN_PIMPINAN } from "@/lib/peran";

const menu: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; mobile: boolean; badge: boolean; khusus?: "pimpinan" }[] = [
  { href: "/", label: "Beranda", icon: House, mobile: true, badge: false },
  { href: "/pimpinan", label: "Pimpinan", icon: LayoutDashboard, mobile: false, badge: false, khusus: "pimpinan" },
  { href: "/absensi", label: "Absensi", icon: ClipboardCheck, mobile: true, badge: false },
  { href: "/jurnal", label: "Jurnal", icon: BookOpen, mobile: true, badge: false },
  { href: "/poin", label: "Poin", icon: TriangleAlert, mobile: true, badge: false },
  { href: "/rekap", label: "Rekap", icon: Table2, mobile: false, badge: false },
  { href: "/kalender", label: "Kalender", icon: CalendarDays, mobile: false, badge: false },
  { href: "/pengumuman", label: "Pengumuman", icon: Bell, mobile: false, badge: true },
  { href: "/profil", label: "Profil", icon: UserRound, mobile: true, badge: false },
];

const labelRole: Record<string, string> = {
  admin: "Admin",
  guru: "Guru",
  guru_bk: "Guru BK",
  kesiswaan: "Waka Kesiswaan",
  kepala_sekolah: "Kepala Sekolah",
  waka_kurikulum: "Waka Kurikulum",
  waka_sdm: "Waka SDM",
  staf: "Staf",
};

export default function Shell({ user, children }: { user: User; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const daftarMenu = menu.filter((m) => !m.khusus || PERAN_PIMPINAN.includes(user.role));

  // Pengganti notifikasi push: diperiksa ulang setiap menit selama tab terbuka
  const pengumuman = useQuery({
    queryKey: ["pengumuman"],
    queryFn: () => api<PengumumanResponse>("pengumuman"),
    refetchInterval: 60_000,
  });

  const belum = pengumuman.data?.belum_dibaca ?? 0;
  const teksBelum = belum > 9 ? "9+" : String(belum);

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
          {daftarMenu.map(({ href, label, icon: Ikon, badge }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors ${
                aktif(href) ? "bg-orange-100 text-orange-700" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Ikon className="size-5" />
              {label}
              {badge && belum > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-bold text-white">
                  {teksBelum}
                </span>
              )}
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
        <div
          className={`mx-auto px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] md:pb-10 md:pt-8 ${
            pathname === "/pimpinan" ? "max-w-none md:px-6" : "max-w-5xl md:px-8"
          }`}
        >
          {/* Bilah atas: HP */}
          <div className="mb-4 flex items-center justify-between md:hidden">
            <p className="text-xl font-bold text-orange-600">Sipedas</p>

            <Link
              href="/pengumuman"
              aria-label="Pengumuman"
              className="relative rounded-full p-2 text-orange-600 active:bg-orange-100"
            >
              <Bell className="size-6" />
              {belum > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-600 px-1 text-[10px] font-bold text-white">
                  {teksBelum}
                </span>
              )}
            </Link>
          </div>

          {children}
        </div>
      </div>

      {/* Menu bawah: HP */}
      <nav className="fixed inset-x-4 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-20 flex gap-1 rounded-[1.75rem] border border-white/90 bg-white/85 p-1.5 shadow-xl shadow-black/10 backdrop-blur-xl md:hidden">
        {daftarMenu
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