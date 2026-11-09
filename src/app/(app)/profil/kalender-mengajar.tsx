"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/api-client";
import type { Acara, JadwalMinggu, JadwalSaya, PiketMinggu } from "@/lib/types";
import {
  dariIso,
  hariIso,
  geserBulan,
  keBulan,
  keIso,
  labelBulan,
  labelHariBulan,
  labelTanggal,
  mingguDalamBulan,
  namaHariPendek,
  susunKalender,
} from "@/lib/tanggal";

export default function KalenderMengajar() {
  const hariIni = keIso(new Date());

  const [bulan, setBulan] = useState(keBulan(new Date()));
  const [dipilih, setDipilih] = useState(hariIni);
  const [mode, setMode] = useState<"tanggal" | "minggu">("tanggal");

  const saya = useQuery({
    queryKey: ["jadwal-saya"],
    queryFn: () => api<JadwalSaya>("jadwal/saya"),
    staleTime: 5 * 60_000,
  });

  const kalender = useQuery({
    queryKey: ["kalender-akademik"],
    queryFn: () => api<{ data: Acara[] }>("kalender-akademik"),
    staleTime: 5 * 60_000,
  });

  if (saya.isPending) return <div className="h-80 animate-pulse rounded-3xl bg-gray-100" />;

  if (saya.isError) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6">
        <p className="font-medium text-red-700">{saya.error.message}</p>
        <button
          onClick={() => saya.refetch()}
          className="mt-3 rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  const ta = saya.data.tahun_ajaran;
  const sesiPola = saya.data.data;
  const piketPola = saya.data.piket ?? [];
  const acara = kalender.data?.data ?? [];

  // Bulan dijepit ke rentang tahun ajaran
  const bulanMulai = ta.tanggal_mulai.slice(0, 7);
  const bulanSelesai = ta.tanggal_selesai.slice(0, 7);
  const bulanAktif = bulan < bulanMulai ? bulanMulai : bulan > bulanSelesai ? bulanSelesai : bulan;
  const tanggalAktif = dipilih.startsWith(bulanAktif) ? dipilih : `${bulanAktif}-01`;

  const dalamTA = (iso: string) => iso >= ta.tanggal_mulai && iso <= ta.tanggal_selesai;

  const liburAdmin = (iso: string) =>
    acara.find((a) => a.jenis === "libur" && iso >= a.tanggal_mulai && iso <= a.tanggal_selesai);

  // Libur: acara buatan admin, atau Sabtu dan Minggu
  const libur = (iso: string): { judul: string; keterangan: string | null } | null => {
    const a = liburAdmin(iso);
    if (a) return { judul: a.judul, keterangan: a.keterangan };
    if (hariIso(dariIso(iso)) > 5) return { judul: "Akhir pekan", keterangan: null };
    return null;
  };

  const peringatan = (iso: string) =>
    acara.filter((a) => a.jenis === "peringatan" && iso >= a.tanggal_mulai && iso <= a.tanggal_selesai);

  const sesi = (iso: string): JadwalMinggu[] =>
    !dalamTA(iso) || libur(iso)
      ? []
      : sesiPola.filter((s) => s.hari === hariIso(dariIso(iso))).sort((a, b) => a.jam_ke_mulai - b.jam_ke_mulai);

  const piket = (iso: string): PiketMinggu[] =>
    !dalamTA(iso) || libur(iso)
      ? []
      : piketPola.filter((p) => p.hari === hariIso(dariIso(iso))).sort((a, b) => a.jam_ke_mulai - b.jam_ke_mulai);

  const adaIsi = (iso: string) =>
    sesi(iso).length > 0 || piket(iso).length > 0 || !!liburAdmin(iso) || peringatan(iso).length > 0;

  function pindahBulan(delta: number) {
    const baru = geserBulan(bulanAktif, delta);
    setBulan(baru);
    setDipilih(baru === keBulan(new Date()) ? hariIni : `${baru}-01`);
  }

  const { kosong, hari } = susunKalender(bulanAktif);

  return (
    <section className="space-y-4 rounded-3xl border border-white/80 bg-white/70 p-5 backdrop-blur">
      <div className="flex items-center justify-between">
        <button
          onClick={() => pindahBulan(-1)}
          disabled={bulanAktif <= bulanMulai}
          className="rounded-xl p-2 hover:bg-gray-100 disabled:opacity-30"
          aria-label="Bulan sebelumnya"
        >
          <ChevronLeft className="size-5" />
        </button>
        <div className="text-center">
          <h2 className="text-lg font-bold">Kalender mengajar · {labelBulan(bulanAktif)}</h2>
          <p className="text-xs text-gray-500">Tahun ajaran {ta.nama}</p>
        </div>
        <button
          onClick={() => pindahBulan(1)}
          disabled={bulanAktif >= bulanSelesai}
          className="rounded-xl p-2 hover:bg-gray-100 disabled:opacity-30"
          aria-label="Bulan berikutnya"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 text-center text-xs font-medium text-gray-500">
        {namaHariPendek.map((n) => (
          <div key={n} className="py-1">
            {n}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {Array.from({ length: kosong }).map((_, i) => (
          <div key={`k${i}`} />
        ))}

        {hari.map((iso) => {
          const nSesi = sesi(iso).length;
          const nPiket = piket(iso).length;
          const adaPeringatan = peringatan(iso).length > 0;

          // Paling banyak 5 titik: satu disisakan untuk piket dan satu untuk peringatan kalau ada
          const sisa = 5 - (adaPeringatan ? 1 : 0);
          const hijau = nPiket > 0 ? Math.min(nSesi, sisa - 1) : Math.min(nSesi, sisa);
          const oranye = Math.min(nPiket, sisa - hijau);

          const aktif = iso === tanggalAktif;

          return (
            <button
              key={iso}
              onClick={() => setDipilih(iso)}
              className="flex flex-col items-center rounded-xl py-1 hover:bg-orange-50"
            >
              <span
                className={`flex size-9 items-center justify-center rounded-full text-sm ${
                  aktif
                    ? "bg-orange-600 font-semibold text-white"
                    : libur(iso)
                      ? "font-semibold text-red-600"
                      : iso === hariIni
                        ? "border border-orange-600 font-semibold"
                        : ""
                }`}
              >
                {Number(iso.slice(8))}
              </span>
              <span className="mt-0.5 flex h-1.5 gap-0.5">
                {Array.from({ length: hijau }).map((_, i) => (
                  <i key={`h${i}`} className="size-1.5 rounded-full bg-green-600" />
                ))}
                {Array.from({ length: oranye }).map((_, i) => (
                  <i key={`o${i}`} className="size-1.5 rounded-full bg-orange-500" />
                ))}
                {adaPeringatan && <i className="size-1.5 rounded-full bg-sky-600" />}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <i className="size-2 rounded-full bg-green-600" /> Mengajar
        </span>
        <span className="flex items-center gap-1.5">
          <i className="size-2 rounded-full bg-orange-500" /> Piket
        </span>
        <span className="flex items-center gap-1.5">
          <i className="size-2 rounded-full bg-sky-600" /> Peringatan
        </span>
        <span className="flex items-center gap-1.5">
          <b className="text-red-600">12</b> Libur
        </span>
      </div>

      <div className="grid max-w-xs grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1 text-sm font-semibold">
        {(["tanggal", "minggu"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-lg py-1.5 ${mode === m ? "bg-white text-orange-600 shadow-sm" : "text-gray-500"}`}
          >
            {m === "tanggal" ? "Per tanggal" : "Per minggu"}
          </button>
        ))}
      </div>

      {mode === "tanggal" ? (
        <div className="space-y-3">
          <h3 className="font-semibold">{labelTanggal(tanggalAktif)}</h3>
          <IsiHari iso={tanggalAktif} libur={libur} peringatan={peringatan} sesi={sesi} piket={piket} />
        </div>
      ) : (
        <div className="space-y-4">
          {mingguDalamBulan(bulanAktif).map((minggu, i) => {
            const hariIsi = minggu.filter(adaIsi);

            return (
              <div key={i} className="rounded-2xl bg-orange-50/60 p-4">
                <p className="font-bold text-orange-700">
                  Minggu {i + 1} · {labelHariBulan(minggu[0])} – {labelHariBulan(minggu[minggu.length - 1])}
                </p>

                {hariIsi.length === 0 && <p className="mt-2 text-sm text-gray-500">Tidak ada sesi mengajar maupun piket.</p>}

                {hariIsi.map((iso) => (
                  <div key={iso} className="mt-3 space-y-2">
                    <p className="text-sm font-semibold">{labelHariBulan(iso)}</p>
                    <IsiHari iso={iso} libur={libur} peringatan={peringatan} sesi={sesi} piket={piket} />
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function IsiHari({
  iso,
  libur,
  peringatan,
  sesi,
  piket,
}: {
  iso: string;
  libur: (iso: string) => { judul: string; keterangan: string | null } | null;
  peringatan: (iso: string) => Acara[];
  sesi: (iso: string) => JadwalMinggu[];
  piket: (iso: string) => PiketMinggu[];
}) {
  const l = libur(iso);
  const p = peringatan(iso);
  const s = sesi(iso);
  const k = piket(iso);

  if (!l && p.length === 0 && s.length === 0 && k.length === 0) {
    return <p className="text-sm text-gray-500">Tidak ada sesi mengajar maupun piket pada tanggal ini.</p>;
  }

  return (
    <div className="space-y-2">
      {l && (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-3">
          <p className="text-sm font-bold text-red-600">Libur · {l.judul}</p>
          {l.keterangan && <p className="mt-0.5 text-sm">{l.keterangan}</p>}
        </div>
      )}

      {p.map((a) => (
        <div key={a.id} className="rounded-2xl border border-sky-300 bg-sky-50 p-3">
          <p className="text-sm font-bold text-sky-700">Hari ini · {a.judul}</p>
          {a.keterangan && <p className="mt-0.5 text-sm">{a.keterangan}</p>}
        </div>
      ))}

      <div className="grid gap-2 md:grid-cols-2">
        {s.map((x) => (
          <div key={x.id} className="rounded-2xl border-l-4 border-green-600 bg-white/80 p-3">
            <p className="text-sm font-semibold text-green-700">
              Jam ke-{x.jam_ke_mulai}
              {x.jam_ke_selesai !== x.jam_ke_mulai ? `-${x.jam_ke_selesai}` : ""} · {x.jam_mulai} - {x.jam_selesai}
            </p>
            <p className="font-bold">
              {x.kelas?.nama ?? "-"} · {x.mapel?.nama ?? "-"}
            </p>
            {x.ruang && (
              <p className="text-sm text-gray-500">
                {x.ruang.tipe === "lab" ? "Lab" : "Kelas"}: {x.ruang.nama}
              </p>
            )}
          </div>
        ))}

        {k.map((x) => (
          <div key={x.id} className="rounded-2xl border-l-4 border-orange-500 bg-white/80 p-3">
            <p className="text-sm font-semibold text-orange-600">
              Jam ke-{x.jam_ke_mulai}
              {x.jam_ke_selesai !== x.jam_ke_mulai ? `-${x.jam_ke_selesai}` : ""} · {x.jam_mulai} - {x.jam_selesai}
            </p>
            <p className="font-bold">Piket</p>
            {x.tugas && <p className="text-sm text-gray-500">{x.tugas}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}