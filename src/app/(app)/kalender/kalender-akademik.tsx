"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { dariIso, keIso, labelBulan } from "@/lib/tanggal";
import type { Acara } from "@/lib/types";

type Filter = "semua" | "libur" | "peringatan";

const fmtPanjang = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const fmtPendek = new Intl.DateTimeFormat("id-ID", { weekday: "short", day: "numeric", month: "short" });

const selisihHari = (a: string, b: string) => Math.round((dariIso(b).getTime() - dariIso(a).getTime()) / 86_400_000);

function labelRentang(a: Acara) {
  if (a.tanggal_mulai === a.tanggal_selesai) return fmtPanjang.format(dariIso(a.tanggal_mulai));

  const jumlah = selisihHari(a.tanggal_mulai, a.tanggal_selesai) + 1;

  return `${fmtPendek.format(dariIso(a.tanggal_mulai))} – ${fmtPendek.format(dariIso(a.tanggal_selesai))} ${dariIso(a.tanggal_selesai).getFullYear()} (${jumlah} hari)`;
}

export default function KalenderAkademik() {
  const [filter, setFilter] = useState<Filter>("semua");
  const hariIni = keIso(new Date());

  const q = useQuery({
    queryKey: ["kalender-akademik"],
    queryFn: () => api<{ data: Acara[] }>("kalender-akademik"),
    staleTime: 5 * 60_000,
  });

  const daftar = useMemo(
    () => (q.data?.data ?? []).filter((a) => filter === "semua" || a.jenis === filter),
    [q.data, filter],
  );

  // Acara pertama yang belum selesai (termasuk yang sedang berlangsung)
  const berikutnya = daftar.find((a) => a.tanggal_selesai >= hariIni);

  // Kelompokkan per bulan (menurut tanggal mulai)
  const perBulan = useMemo(() => {
    const peta = new Map<string, Acara[]>();

    for (const a of daftar) {
      const kunci = a.tanggal_mulai.slice(0, 7);
      peta.set(kunci, [...(peta.get(kunci) ?? []), a]);
    }

    return [...peta.entries()];
  }, [daftar]);

  if (q.isPending) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-56 animate-pulse rounded bg-gray-100" />
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kalender akademik</h1>
        <p className="text-sm text-gray-500">Libur dan hari peringatan tahun ajaran ini. Sabtu dan Minggu libur otomatis.</p>
      </div>

      <div className="grid max-w-md grid-cols-3 gap-1 rounded-2xl bg-gray-100 p-1 text-sm font-semibold">
        {(["semua", "libur", "peringatan"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-xl py-2 capitalize ${filter === f ? "bg-white text-orange-600 shadow-sm" : "text-gray-500"}`}
          >
            {f}
          </button>
        ))}
      </div>

      {berikutnya && (
        <section
          className={`rounded-3xl p-5 text-white ${
            berikutnya.jenis === "libur" ? "bg-gradient-to-br from-red-500 to-red-600" : "bg-gradient-to-br from-sky-500 to-sky-600"
          }`}
        >
          <p className="text-sm font-medium text-white/90">Berikutnya</p>
          <p className="mt-0.5 text-2xl font-bold">{berikutnya.judul}</p>
          <p className="mt-1 text-sm text-white/90">{labelRentang(berikutnya)}</p>

          <p className="mt-3 inline-block rounded-full bg-white/20 px-3 py-1 text-sm font-semibold">
            {berikutnya.tanggal_mulai <= hariIni
              ? "Sedang berlangsung"
              : `${selisihHari(hariIni, berikutnya.tanggal_mulai)} hari lagi`}
          </p>
        </section>
      )}

      {daftar.length === 0 && <p className="text-gray-500">Belum ada acara pada kategori ini.</p>}

      <div className="max-w-3xl space-y-6">
        {perBulan.map(([bulan, acara]) => (
          <section key={bulan} className="space-y-2.5">
            <h2 className="text-lg font-semibold">{labelBulan(bulan)}</h2>

            {acara.map((a) => {
              const lewat = a.tanggal_selesai < hariIni;
              const libur = a.jenis === "libur";

              return (
                <div
                  key={a.id}
                  className={`rounded-2xl border-l-4 bg-white/70 p-4 backdrop-blur ${
                    libur ? "border-red-500" : "border-sky-500"
                  } ${lewat ? "opacity-50" : ""}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold">{a.judul}</p>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        libur ? "bg-red-100 text-red-700" : "bg-sky-100 text-sky-700"
                      }`}
                    >
                      {libur ? "Libur" : "Peringatan"}
                    </span>
                    {lewat && <span className="text-xs text-gray-500">sudah lewat</span>}
                  </div>

                  <p className="mt-0.5 text-sm text-gray-600">{labelRentang(a)}</p>
                  {a.keterangan && <p className="mt-1 text-sm text-gray-500">{a.keterangan}</p>}
                </div>
              );
            })}
          </section>
        ))}
      </div>
    </div>
  );
}