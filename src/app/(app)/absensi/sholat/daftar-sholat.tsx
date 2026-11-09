"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { KelasSholat } from "@/lib/types";

export default function DaftarSholat() {
  const q = useQuery({
    queryKey: ["sholat-kelas"],
    queryFn: () => api<{ tanggal: string; data: KelasSholat[] }>("sholat/kelas-saya"),
  });

  return (
    <div className="space-y-5">
      <div>
        <Link href="/absensi" className="text-sm text-orange-600">← Kembali</Link>
        <h1 className="mt-1 text-2xl font-bold">Absensi sholat</h1>
      </div>

      {q.isPending && <div className="h-32 animate-pulse rounded-3xl bg-gray-100" />}

      {q.isError && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6">
          <p className="font-medium text-red-700">{q.error.message}</p>
          <button
            onClick={() => q.refetch()}
            className="mt-3 rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Coba lagi
          </button>
        </div>
      )}

      {q.data && q.data.data.length === 0 && (
        <p className="text-gray-500">
          Anda tidak menjadi wali kelas pada tahun ajaran aktif, jadi tidak ada kelas untuk diabsen sholatnya.
        </p>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {q.data?.data.map((k) => (
          <div key={k.id} className="rounded-3xl border border-white/80 bg-white/70 p-5 backdrop-blur">
            <p className="text-xl font-bold">{k.nama}</p>
            <p className="text-sm text-gray-500">{k.jumlah_peserta} siswa muslim</p>

            {!k.absensi_harian_siap && (
              <p className="mt-2 text-sm text-orange-600">
                Isi absensi harian kelas ini dulu, baru absensi sholat bisa dibuka.
              </p>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3">
              <TombolWaktu href={`/absensi/sholat/dhuhur/${k.id}`} label="Dhuhur" tersimpan={k.dhuhur} aktif={k.absensi_harian_siap} />
              <TombolWaktu href={`/absensi/sholat/ashar/${k.id}`} label="Ashar" tersimpan={k.ashar} aktif={k.absensi_harian_siap} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TombolWaktu({
  href,
  label,
  tersimpan,
  aktif,
}: {
  href: string;
  label: string;
  tersimpan: number;
  aktif: boolean;
}) {
  if (!aktif) {
    return (
      <span className="rounded-xl bg-gray-100 py-2.5 text-center text-sm font-semibold text-gray-400">{label}</span>
    );
  }

  return (
    <Link
      href={href}
      className={`rounded-xl py-2.5 text-center text-sm font-semibold ${
        tersimpan > 0 ? "border border-orange-600 text-orange-600" : "bg-orange-600 text-white"
      }`}
    >
      {tersimpan > 0 ? `✓ ${label}` : label}
    </Link>
  );
}