"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/api-client";
import type { Acara, JadwalSaya, JurnalBulan, JurnalItem } from "@/lib/types";
import {
  dariIso,
  geserBulan,
  hariIso,
  keBulan,
  keIso,
  labelBulan,
  labelTanggal,
  labelTanggalPendek,
  namaHariPendek,
  susunKalender,
} from "@/lib/tanggal";

export default function RiwayatJurnal() {
  const hariIni = keIso(new Date());
  const bulanIni = keBulan(new Date());

  const [bulan, setBulan] = useState(bulanIni);
  const [dipilih, setDipilih] = useState(hariIni);
  const [kata, setKata] = useState("");
  const [kelasF, setKelasF] = useState("");
  const [mapelF, setMapelF] = useState("");

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

  const jurnal = useQuery({
    queryKey: ["jurnal-bulan", bulan],
    queryFn: () => api<JurnalBulan>(`jurnal/bulan?bulan=${bulan}`),
  });

  const ta = saya.data?.tahun_ajaran;
  const bulanMulai = ta ? ta.tanggal_mulai.slice(0, 7) : bulan;
  const bisaMundur = bulan > bulanMulai;
  const bisaMaju = bulan < bulanIni;

  function pindahBulan(delta: number) {
    const baru = geserBulan(bulan, delta);
    setBulan(baru);
    setDipilih(baru === bulanIni ? hariIni : `${baru}-01`);
    setKata("");
    setKelasF("");
    setMapelF("");
  }

  // Libur: acara libur buatan admin, atau akhir pekan
  const liburPada = (iso: string): { judul: string; keterangan: string | null } | null => {
    const a = kalender.data?.data.find((x) => x.jenis === "libur" && iso >= x.tanggal_mulai && iso <= x.tanggal_selesai);
    if (a) return { judul: a.judul, keterangan: a.keterangan };
    if (hariIso(dariIso(iso)) > 5) return { judul: "Akhir pekan", keterangan: null };
    return null;
  };

  const dataJurnal = useMemo(() => jurnal.data?.data ?? [], [jurnal.data]);

  const jurnalPada = (iso: string) =>
    dataJurnal.filter((j) => j.tanggal === iso).sort((a, b) => (a.jam_ke_mulai ?? 99) - (b.jam_ke_mulai ?? 99));

  // Sesi di tanggal lampau yang jurnalnya tidak ada (dihitung dari jadwal mingguan)
  const terlewatPada = (iso: string) => {
    if (!saya.data || !jurnal.data || !ta) return [];
    if (iso >= hariIni || iso < ta.tanggal_mulai || iso > ta.tanggal_selesai) return [];
    if (liburPada(iso)) return [];

    const sudah = new Set(jurnalPada(iso).map((j) => j.jadwal_id));
    const hari = hariIso(dariIso(iso));

    return saya.data.data.filter((s) => s.hari === hari && !sudah.has(s.id)).sort((a, b) => a.jam_ke_mulai - b.jam_ke_mulai);
  };

  const { kosong, hari } = susunKalender(bulan);

  const jumlahTerlewat = hari.reduce((n, iso) => n + terlewatPada(iso).length, 0);

  // Tabel: saring dan urutkan dari yang terbaru
  const opsiKelas = [...new Set(dataJurnal.map((j) => j.kelas?.nama).filter(Boolean))] as string[];
  const opsiMapel = [...new Set(dataJurnal.map((j) => j.mapel?.nama).filter(Boolean))] as string[];

  const tabel = useMemo(() => {
    const cari = kata.trim().toLowerCase();

    return dataJurnal
      .filter((j) => !kelasF || j.kelas?.nama === kelasF)
      .filter((j) => !mapelF || j.mapel?.nama === mapelF)
      .filter(
        (j) =>
          !cari ||
          j.materi.toLowerCase().includes(cari) ||
          (j.catatan ?? "").toLowerCase().includes(cari) ||
          (j.kelas?.nama ?? "").toLowerCase().includes(cari) ||
          (j.mapel?.nama ?? "").toLowerCase().includes(cari),
      )
      .sort((a, b) => (a.tanggal === b.tanggal ? (a.jam_ke_mulai ?? 0) - (b.jam_ke_mulai ?? 0) : a.tanggal < b.tanggal ? 1 : -1));
  }, [dataJurnal, kata, kelasF, mapelF]);

  const libur = liburPada(dipilih);
  const jurnalDipilih = jurnalPada(dipilih);
  const terlewatDipilih = terlewatPada(dipilih);

  return (
    <div className="space-y-6">
      {/* Kalender */}
      <section className="rounded-3xl border border-white/80 bg-white/70 p-5 backdrop-blur">
        <div className="flex items-center justify-between">
          <button
            onClick={() => pindahBulan(-1)}
            disabled={!bisaMundur}
            className="rounded-xl p-2 hover:bg-gray-100 disabled:opacity-30"
            aria-label="Bulan sebelumnya"
          >
            <ChevronLeft className="size-5" />
          </button>
          <div className="text-center">
            <p className="text-lg font-bold">{labelBulan(bulan)}</p>
            {ta && <p className="text-xs text-gray-500">Tahun ajaran {ta.nama}</p>}
          </div>
          <button
            onClick={() => pindahBulan(1)}
            disabled={!bisaMaju}
            className="rounded-xl p-2 hover:bg-gray-100 disabled:opacity-30"
            aria-label="Bulan berikutnya"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        <div className="mt-3 grid grid-cols-7 text-center text-xs font-medium text-gray-500">
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
            const hijau = Math.min(5, jurnalPada(iso).length);
            const merah = Math.min(5 - hijau, terlewatPada(iso).length);
            const aktif = iso === dipilih;
            const adaLibur = !!liburPada(iso);

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
                      : adaLibur
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
                    <i key={`g${i}`} className="size-1.5 rounded-full bg-green-600" />
                  ))}
                  {Array.from({ length: merah }).map((_, i) => (
                    <i key={`r${i}`} className="size-1.5 rounded-full bg-red-600" />
                  ))}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <i className="size-2 rounded-full bg-green-600" /> Jurnal terisi
          </span>
          <span className="flex items-center gap-1.5">
            <i className="size-2 rounded-full bg-red-600" /> Belum diisi
          </span>
          <span className="flex items-center gap-1.5">
            <i className="size-2 rounded-full border border-red-600" /> Libur
          </span>
        </div>
      </section>

      {/* Detail tanggal terpilih */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{labelTanggal(dipilih)}</h2>

        {libur && (
          <div className="rounded-2xl border border-red-300 bg-red-50 p-4">
            <p className="font-bold text-red-600">Libur · {libur.judul}</p>
            {libur.keterangan && <p className="mt-1 text-sm">{libur.keterangan}</p>}
          </div>
        )}

        {jurnal.isPending && <div className="h-20 animate-pulse rounded-2xl bg-gray-100" />}

        {jurnal.isError && <p className="text-red-600">{jurnal.error.message}</p>}

        {jurnal.data && jurnalDipilih.length === 0 && terlewatDipilih.length === 0 && !libur && (
          <p className="text-gray-500">Tidak ada jurnal pada tanggal ini.</p>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          {jurnalDipilih.map((j) => (
            <div key={j.id} className="rounded-2xl border border-green-200 bg-green-50/60 p-4">
              <p className="text-sm font-semibold text-green-700">
                {j.jam_ke_mulai !== null &&
                  `Jam ke-${j.jam_ke_mulai}${j.jam_ke_selesai !== j.jam_ke_mulai ? `-${j.jam_ke_selesai}` : ""} · ${j.jam_mulai} - ${j.jam_selesai}`}
              </p>
              <p className="font-bold">
                {j.kelas?.nama ?? "-"} · {j.mapel?.nama ?? "-"}
              </p>
              <p className="mt-1 whitespace-pre-line text-sm">{j.materi}</p>
              {j.catatan && <p className="mt-1 text-sm text-gray-500">Catatan: {j.catatan}</p>}
            </div>
          ))}

          {terlewatDipilih.map((s) => (
            <div key={s.id} className="rounded-2xl border border-red-200 bg-red-50/60 p-4">
              <p className="text-sm font-semibold text-red-600">
                Jam ke-{s.jam_ke_mulai}
                {s.jam_ke_selesai !== s.jam_ke_mulai ? `-${s.jam_ke_selesai}` : ""} · {s.jam_mulai} - {s.jam_selesai}
              </p>
              <p className="font-bold">
                {s.kelas?.nama ?? "-"} · {s.mapel?.nama ?? "-"}
              </p>
              <p className="mt-1 text-sm text-red-600">Jurnal belum diisi</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tabel sebulan */}
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Daftar jurnal · {labelBulan(bulan)}</h2>
          <p className="text-sm text-gray-500">
            {dataJurnal.length} jurnal terisi
            {jumlahTerlewat > 0 ? ` · ${jumlahTerlewat} sesi belum diisi` : ""}
          </p>
        </div>

        <div className="grid gap-2 md:grid-cols-3">
          <input
            value={kata}
            onChange={(e) => setKata(e.target.value)}
            placeholder="Cari materi, kelas, atau mapel…"
            className="rounded-2xl border border-gray-300 bg-white/80 px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-orange-500 md:text-sm"
          />
          <select
            value={kelasF}
            onChange={(e) => setKelasF(e.target.value)}
            className="rounded-2xl border border-gray-300 bg-white px-4 py-2.5 text-base outline-none md:text-sm"
          >
            <option value="">Semua kelas</option>
            {opsiKelas.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
          <select
            value={mapelF}
            onChange={(e) => setMapelF(e.target.value)}
            className="rounded-2xl border border-gray-300 bg-white px-4 py-2.5 text-base outline-none md:text-sm"
          >
            <option value="">Semua mapel</option>
            {opsiMapel.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-white/80 bg-white/80 backdrop-blur">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="border-b border-gray-200 bg-orange-50/70 text-gray-600">
              <tr>
                <th className="px-3 py-2.5 font-semibold">Tanggal</th>
                <th className="px-3 py-2.5 font-semibold">Jam</th>
                <th className="px-3 py-2.5 font-semibold">Kelas</th>
                <th className="px-3 py-2.5 font-semibold">Mapel</th>
                <th className="px-3 py-2.5 font-semibold">Materi</th>
                <th className="px-3 py-2.5 font-semibold">Catatan</th>
              </tr>
            </thead>
            <tbody>
              {tabel.map((j: JurnalItem) => (
                <tr key={j.id} className="border-b border-gray-100 align-top last:border-0">
                  <td className="whitespace-nowrap px-3 py-2.5">{labelTanggalPendek(j.tanggal)}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-gray-500">
                    {j.jam_ke_mulai !== null
                      ? `${j.jam_ke_mulai}${j.jam_ke_selesai !== j.jam_ke_mulai ? `-${j.jam_ke_selesai}` : ""}`
                      : "-"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 font-medium">{j.kelas?.nama ?? "-"}</td>
                  <td className="px-3 py-2.5">{j.mapel?.nama ?? "-"}</td>
                  <td className="max-w-xs whitespace-pre-line px-3 py-2.5">{j.materi}</td>
                  <td className="max-w-[12rem] px-3 py-2.5 text-gray-500">{j.catatan ?? "–"}</td>
                </tr>
              ))}

              {tabel.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-gray-500">
                    {jurnal.isPending ? "Memuat…" : "Tidak ada jurnal yang cocok."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}