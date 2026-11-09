"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import type { SiswaKelas, StatusAbsen } from "@/lib/types";

type Pilihan = { status: StatusAbsen | null; keterangan: string };

const opsi: { kode: StatusAbsen; label: string; aktif: string; pasif: string; ringkas: string }[] = [
  { kode: "hadir", label: "Hadir", aktif: "bg-green-600 text-white border-green-600", pasif: "text-green-700 border-green-300 bg-green-50", ringkas: "bg-green-50 text-green-700" },
  { kode: "sakit", label: "Sakit", aktif: "bg-amber-600 text-white border-amber-600", pasif: "text-amber-700 border-amber-300 bg-amber-50", ringkas: "bg-amber-50 text-amber-700" },
  { kode: "izin", label: "Izin", aktif: "bg-sky-600 text-white border-sky-600", pasif: "text-sky-700 border-sky-300 bg-sky-50", ringkas: "bg-sky-50 text-sky-700" },
  { kode: "alpa", label: "Alpa", aktif: "bg-red-600 text-white border-red-600", pasif: "text-red-700 border-red-300 bg-red-50", ringkas: "bg-red-50 text-red-700" },
];

export default function SiswaAbsensi({ kelasId }: { kelasId: number }) {
  const q = useQuery({
    queryKey: ["kelas-siswa", kelasId],
    queryFn: () => api<SiswaKelas>(`kelas/${kelasId}/siswa`),
    // Jangan muat ulang saat pindah tab: pilihan yang belum disimpan tidak boleh terhapus
    refetchOnWindowFocus: false,
  });

  if (q.isPending) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-56 animate-pulse rounded bg-gray-100" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100" />
        ))}
      </div>
    );
  }

  if (q.isError) {
    return (
      <div className="space-y-3">
        <Link href="/absensi" className="text-sm text-orange-600">← Kembali</Link>
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6">
          <p className="font-medium text-red-700">{q.error.message}</p>
          <button
            onClick={() => q.refetch()}
            className="mt-3 rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Coba lagi
          </button>
        </div>
      </div>
    );
  }

  // key berubah saat status di server berubah (misalnya setelah disimpan), sehingga formulir
  // dimuat ulang dari data terbaru; selama tidak berubah, pilihan yang belum disimpan tetap aman
  const kunci = q.data.data.map((s) => `${s.id}:${s.status ?? "-"}`).join("|");

  return <Formulir key={kunci} kelasId={kelasId} data={q.data} />;
}

function Formulir({ kelasId, data }: { kelasId: number; data: SiswaKelas }) {
  const qc = useQueryClient();
  const siswa = data.data;

  const [pilihan, setPilihan] = useState<Record<number, Pilihan>>(() =>
    Object.fromEntries(siswa.map((s) => [s.id, { status: s.status, keterangan: s.keterangan ?? "" }])),
  );

  const belum = siswa.filter((s) => !pilihan[s.id]?.status).length;
  const jumlah = (kode: StatusAbsen) => siswa.filter((s) => pilihan[s.id]?.status === kode).length;

  function pilih(id: number, status: StatusAbsen) {
    setPilihan((p) => ({
      ...p,
      [id]: { status, keterangan: status === "hadir" ? "" : (p[id]?.keterangan ?? "") },
    }));
  }

  function ketik(id: number, keterangan: string) {
    setPilihan((p) => ({ ...p, [id]: { ...p[id], keterangan } }));
  }

  function semuaHadir() {
    setPilihan(Object.fromEntries(siswa.map((s) => [s.id, { status: "hadir" as const, keterangan: "" }])));
  }

  const simpan = useMutation({
    mutationFn: () =>
      api<{ message: string; jumlah: number }>("absensi", {
        method: "POST",
        body: {
          kelas_id: kelasId,
          items: siswa.map((s) => ({
            siswa_id: s.id,
            status: pilihan[s.id].status,
            keterangan: pilihan[s.id].keterangan.trim() || null,
          })),
        },
      }),
    onSuccess: (res) => {
      toast.success("Absensi tersimpan", { description: `${res.jumlah} siswa dicatat di ${data.kelas.nama}` });
      qc.invalidateQueries({ queryKey: ["kelas-siswa", kelasId] });
      qc.invalidateQueries({ queryKey: ["absensi-kelas"] });
      qc.invalidateQueries({ queryKey: ["statistik-guru"] });
    },
    onError: (e) => toast.error("Gagal menyimpan absensi", { description: e.message }),
  });

  return (
    <div className="space-y-5">
      <div>
        <Link href="/absensi" className="text-sm text-orange-600">← Kembali</Link>
        <h1 className="mt-1 text-2xl font-bold">{data.kelas.nama}</h1>
        <p className="text-sm text-gray-500">Absensi harian · {siswa.length} siswa</p>
      </div>

      {/* Ringkasan */}
      <div className="grid grid-cols-4 gap-2">
        {opsi.map((o) => (
          <div key={o.kode} className={`rounded-2xl py-3 text-center ${o.ringkas}`}>
            <p className="text-2xl font-bold">{jumlah(o.kode)}</p>
            <p className="text-xs font-medium">{o.label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm">
        <p className="text-gray-500">{belum === 0 ? "Semua siswa sudah ditandai" : `${belum} siswa belum ditandai`}</p>
        <button onClick={semuaHadir} className="font-semibold text-orange-600">
          Tandai semua hadir
        </button>
      </div>

      {/* Daftar siswa */}
      <div className="space-y-2.5">
        {siswa.map((s, i) => {
          const p = pilihan[s.id];
          const tersimpan = !!p.status && p.status !== "hadir" && p.status === s.status;

          return (
            <div
              key={s.id}
              className="grid gap-3 rounded-2xl border border-white/80 bg-white/70 p-4 backdrop-blur md:grid-cols-[minmax(0,1fr)_auto_14rem] md:items-center"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold">
                  <span className="mr-2 text-sm font-normal text-gray-400">{i + 1}.</span>
                  {s.nama}
                </p>
                <p className="ml-6 text-xs text-gray-500">{s.nis}</p>
              </div>

              <div className="flex gap-1.5">
                {opsi.map((o) => (
                  <button
                    key={o.kode}
                    type="button"
                    onClick={() => pilih(s.id, o.kode)}
                    className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors md:flex-none ${
                      p.status === o.kode ? o.aktif : o.pasif
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>

              <div>
                {p.status && p.status !== "hadir" && (
                  <input
                    value={p.keterangan}
                    onChange={(e) => ketik(s.id, e.target.value)}
                    placeholder="Keterangan (opsional)"
                    maxLength={255}
                    className="w-full rounded-xl border border-gray-300 bg-white/80 px-3 py-2 text-base outline-none focus:ring-2 focus:ring-orange-500 md:text-sm"
                  />
                )}

                {tersimpan &&
                  (s.wa_link ? (
                    <a
                      href={s.wa_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block rounded-xl border border-green-600 px-3 py-1.5 text-sm font-semibold text-green-700 hover:bg-green-50"
                    >
                      WhatsApp wali
                    </a>
                  ) : (
                    <p className="mt-2 text-xs text-gray-500">Nomor wali belum diisi</p>
                  ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tombol simpan: menempel di bawah layar */}
      <div className="sticky bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-10 md:bottom-4">
        <button
          onClick={() => simpan.mutate()}
          disabled={belum > 0 || simpan.isPending}
          className="w-full rounded-2xl bg-orange-600 py-3.5 text-base font-semibold text-white shadow-lg shadow-orange-600/30 disabled:bg-gray-300 disabled:shadow-none"
        >
          {simpan.isPending ? "Menyimpan…" : belum > 0 ? `Tandai ${belum} siswa lagi` : "Simpan absensi"}
        </button>
      </div>
    </div>
  );
}