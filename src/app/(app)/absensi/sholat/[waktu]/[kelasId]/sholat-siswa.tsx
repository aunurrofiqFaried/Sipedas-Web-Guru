"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import type { SholatSiswaResponse, StatusAbsen, StatusSholat } from "@/lib/types";

const labelWaktu: Record<string, string> = { dhuhur: "Dhuhur", ashar: "Ashar" };

const opsi: { kode: StatusSholat; label: string; aktif: string; pasif: string; ringkas: string }[] = [
  { kode: "hadir", label: "Hadir", aktif: "bg-green-600 text-white border-green-600", pasif: "text-green-700 border-green-300 bg-green-50", ringkas: "bg-green-50 text-green-700" },
  { kode: "tidak_hadir", label: "Tidak hadir", aktif: "bg-red-600 text-white border-red-600", pasif: "text-red-700 border-red-300 bg-red-50", ringkas: "bg-red-50 text-red-700" },
  { kode: "berhalangan", label: "Berhalangan", aktif: "bg-amber-600 text-white border-amber-600", pasif: "text-amber-700 border-amber-300 bg-amber-50", ringkas: "bg-amber-50 text-amber-700" },
];

function alasan(s: StatusAbsen | null) {
  if (s === "sakit") return "Sakit (absensi pagi)";
  if (s === "izin") return "Izin (absensi pagi)";
  if (s === "alpa") return "Alpa (absensi pagi)";
  return "Belum diabsen pagi";
}

export default function SholatSiswa({ waktu, kelasId }: { waktu: string; kelasId: number }) {
  const sah = waktu in labelWaktu;

  const q = useQuery({
    queryKey: ["sholat-siswa", waktu, kelasId],
    queryFn: () => api<SholatSiswaResponse>(`sholat/${waktu}/kelas/${kelasId}`),
    enabled: sah,
    refetchOnWindowFocus: false, // pilihan yang belum disimpan tidak boleh terhapus
  });

  const kembali = (
    <Link href="/absensi/sholat" className="text-sm text-orange-600">
      ← Kembali
    </Link>
  );

  if (!sah) {
    return (
      <div className="space-y-3">
        {kembali}
        <p className="text-red-600">Waktu sholat tidak dikenal.</p>
      </div>
    );
  }

  if (q.isPending) {
    return (
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100" />
        ))}
      </div>
    );
  }

  if (q.isError) {
    return (
      <div className="space-y-3">
        {kembali}
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6">
          <p className="font-medium text-red-700">{q.error.message}</p>
        </div>
      </div>
    );
  }

  const kunci = q.data.data.map((s) => `${s.id}:${s.status ?? "-"}`).join("|");

  return <Formulir key={kunci} waktu={waktu} kelasId={kelasId} data={q.data} />;
}

function Formulir({ waktu, kelasId, data }: { waktu: string; kelasId: number; data: SholatSiswaResponse }) {
  const qc = useQueryClient();
  const semua = data.data;
  const bisaDitandai = semua.filter((s) => !s.terkunci);
  const terkunci = semua.length - bisaDitandai.length;

  const [pilihan, setPilihan] = useState<Record<number, StatusSholat | null>>(() =>
    Object.fromEntries(bisaDitandai.map((s) => [s.id, s.status])),
  );

  const belum = bisaDitandai.filter((s) => !pilihan[s.id]).length;
  const jumlah = (kode: StatusSholat) => bisaDitandai.filter((s) => pilihan[s.id] === kode).length;

  const simpan = useMutation({
    mutationFn: () =>
      api<{ message: string; jumlah: number }>("sholat", {
        method: "POST",
        body: {
          kelas_id: kelasId,
          waktu,
          items: bisaDitandai.map((s) => ({ siswa_id: s.id, status: pilihan[s.id] })),
        },
      }),
    onSuccess: (res) => {
      toast.success(`Absensi sholat ${labelWaktu[waktu]} tersimpan`, {
        description: `${res.jumlah} siswa dicatat · masih bisa diubah hari ini`,
      });
      qc.invalidateQueries({ queryKey: ["sholat-siswa", waktu, kelasId] });
      qc.invalidateQueries({ queryKey: ["sholat-kelas"] });
    },
    onError: (e) => toast.error("Gagal menyimpan", { description: e.message }),
  });

  return (
    <div className="space-y-5">
      <div>
        <Link href="/absensi/sholat" className="text-sm text-orange-600">← Kembali</Link>
        <h1 className="mt-1 text-2xl font-bold">
          {labelWaktu[waktu]} · {data.kelas.nama}
        </h1>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {opsi.map((o) => (
          <div key={o.kode} className={`rounded-2xl py-3 text-center ${o.ringkas}`}>
            <p className="text-2xl font-bold">{jumlah(o.kode)}</p>
            <p className="text-xs font-medium">{o.label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm">
        <p className="text-gray-500">
          {belum === 0 ? "Semua siswa sudah ditandai" : `${belum} siswa belum ditandai`}
          {terkunci > 0 ? ` · ${terkunci} tidak ikut (absen pagi)` : ""}
        </p>
        <button
          onClick={() => setPilihan(Object.fromEntries(bisaDitandai.map((s) => [s.id, "hadir" as const])))}
          className="font-semibold text-orange-600"
        >
          Tandai semua hadir
        </button>
      </div>

      {semua.length === 0 && <p className="text-gray-500">Tidak ada siswa muslim di kelas ini.</p>}

      <div className="space-y-2.5">
        {semua.map((s, i) => (
          <div
            key={s.id}
            className={`grid gap-3 rounded-2xl border border-white/80 bg-white/70 p-4 backdrop-blur md:grid-cols-[minmax(0,1fr)_auto] md:items-center ${
              s.terkunci ? "opacity-60" : ""
            }`}
          >
            <div className="min-w-0">
              <p className="truncate font-semibold">
                <span className="mr-2 text-sm font-normal text-gray-400">{i + 1}.</span>
                {s.nama}
              </p>
              <p className="ml-6 text-xs text-gray-500">{s.nis}</p>
            </div>

            {s.terkunci ? (
              <p className="text-sm text-gray-500">Tidak ikut sholat · {alasan(s.status_harian)}</p>
            ) : (
              <div className="flex gap-1.5">
                {opsi
                  // "Berhalangan" hanya tersedia untuk siswi
                  .filter((o) => o.kode !== "berhalangan" || s.jenis_kelamin === "P")
                  .map((o) => (
                    <button
                      key={o.kode}
                      type="button"
                      onClick={() => setPilihan((p) => ({ ...p, [s.id]: o.kode }))}
                      className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors md:flex-none ${
                        pilihan[s.id] === o.kode ? o.aktif : o.pasif
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="sticky bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-10 md:bottom-4">
        <button
          onClick={() => simpan.mutate()}
          disabled={bisaDitandai.length === 0 || belum > 0 || simpan.isPending}
          className="w-full rounded-2xl bg-orange-600 py-3.5 text-base font-semibold text-white shadow-lg shadow-orange-600/30 disabled:bg-gray-300 disabled:shadow-none"
        >
          {simpan.isPending
            ? "Menyimpan…"
            : bisaDitandai.length === 0
              ? "Tidak ada siswa yang perlu ditandai"
              : belum > 0
                ? `Tandai ${belum} siswa lagi`
                : "Simpan absensi sholat"}
        </button>
      </div>
    </div>
  );
}