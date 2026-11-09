"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { KelasAbsen, KelasHariIni } from "@/lib/types";

const keteranganAlasan: Record<string, string> = {
  wali: "Kelas Anda (wali kelas)",
  jadwal: "Anda mengajar di jam ke-1 atau ke-2",
  pengganti: "Belum diabsen · bantu mengabsen",
  admin: "Akses admin",
};

export default function DaftarKelas() {
  const q = useQuery({
    queryKey: ["absensi-kelas"],
    queryFn: () => api<KelasHariIni>("absensi/kelas-hari-ini"),
  });

  if (q.isPending) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-100" />
        <div className="h-24 animate-pulse rounded-3xl bg-gray-100" />
        <div className="h-24 animate-pulse rounded-3xl bg-gray-100" />
      </div>
    );
  }

  if (q.isError) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6">
        <p className="font-medium text-red-700">{q.error.message}</p>
        <button
          onClick={() => q.refetch()}
          className="mt-3 rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  const kelas = q.data.data;
  const wajib = kelas.filter((k) => k.alasan === "wali" || k.alasan === "jadwal");
  const lainnya = kelas.filter((k) => k.alasan !== "wali" && k.alasan !== "jadwal");
  const admin = lainnya.some((k) => k.alasan === "admin");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Absensi hari ini</h1>

      {q.data.libur && (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-4">
          <p className="font-bold text-red-600">Libur · {q.data.libur.judul}</p>
          {q.data.libur.keterangan && <p className="mt-1 text-sm">{q.data.libur.keterangan}</p>}
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Wajib Anda absen</h2>

        {wajib.length === 0 ? (
          <p className="text-gray-500">
            {lainnya.length === 0
              ? "Tidak ada kelas yang perlu Anda absen sekarang. Kelas yang belum diabsen akan terbuka untuk semua guru setelah jam ke-2 dimulai."
              : "Tidak ada kelas wajib untuk Anda hari ini."}
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {wajib.map((k) => (
              <KartuKelas key={k.id} k={k} />
            ))}
          </div>
        )}
      </section>

      {lainnya.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">{admin ? "Semua kelas" : "Bantu mengabsen kelas lain"}</h2>
            {!admin && (
              <p className="text-sm text-gray-500">
                Kelas di bawah ini belum diabsen dan terbuka untuk semua guru karena jam ke-2 sudah dimulai.
              </p>
            )}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {lainnya.map((k) => (
              <KartuKelas key={k.id} k={k} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function KartuKelas({ k }: { k: KelasAbsen }) {
  const status =
    k.sudah_diabsen === 0
      ? { teks: "Belum diabsen", kelas: "text-orange-600" }
      : k.sudah_diabsen < k.jumlah_siswa
        ? { teks: `Sebagian (${k.sudah_diabsen}/${k.jumlah_siswa})`, kelas: "text-orange-600" }
        : { teks: "✓ Sudah diabsen", kelas: "text-green-600" };

  return (
    <Link
      href={`/absensi/${k.id}`}
      className="flex items-center justify-between rounded-3xl border border-white/80 bg-white/70 p-5 shadow-sm backdrop-blur transition-shadow hover:shadow-md"
    >
      <div>
        <p className="text-xl font-bold">{k.nama}</p>
        <p className="text-sm text-gray-500">{k.jumlah_siswa} siswa</p>
        {k.alasan && (
          <p className={`text-xs ${k.alasan === "pengganti" ? "text-orange-600" : "text-gray-500"}`}>
            {keteranganAlasan[k.alasan]}
          </p>
        )}
      </div>
      <span className={`text-sm font-semibold ${status.kelas}`}>{status.teks}</span>
    </Link>
  );
}