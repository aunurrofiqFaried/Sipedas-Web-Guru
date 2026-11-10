"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Modal from "@/components/modal";
import { api } from "@/lib/api-client";
import { keIso, labelTanggalPendek } from "@/lib/tanggal";
import type { DetailKepatuhan, GuruKepatuhan, KepatuhanJurnal } from "@/lib/types";

type Rentang = { dari: string; sampai: string } | null; // null = seluruh tahun ajaran
type Filter = "semua" | "baik" | "cukup" | "kurang";

const awalBulan = (d: Date) => keIso(new Date(d.getFullYear(), d.getMonth(), 1));
const akhirBulan = (d: Date) => keIso(new Date(d.getFullYear(), d.getMonth() + 1, 0));

const teksPersen = (p: number | null) => (p === null ? "-" : `${p}%`);

const warnaTeks = (p: number | null) =>
  p === null ? "text-gray-400" : p >= 90 ? "text-green-700" : p >= 75 ? "text-amber-600" : "text-red-600";
const warnaBatang = (p: number | null) =>
  p === null ? "bg-gray-300" : p >= 90 ? "bg-green-600" : p >= 75 ? "bg-amber-500" : "bg-red-600";

const lencana: Record<string, string> = {
  baik: "bg-green-100 text-green-700",
  cukup: "bg-amber-100 text-amber-700",
  kurang: "bg-red-100 text-red-700",
};

const parameterDari = (r: Rentang) => (r ? `?dari=${r.dari}&sampai=${r.sampai}` : "");

export default function KepatuhanJurnalHalaman() {
  const hariIni = new Date();

  const [rentang, setRentang] = useState<Rentang>({ dari: awalBulan(hariIni), sampai: akhirBulan(hariIni) });
  const [kata, setKata] = useState("");
  const [filter, setFilter] = useState<Filter>("semua");
  const [detailId, setDetailId] = useState<number | null>(null);

  const q = useQuery({
    queryKey: ["kepatuhan-jurnal", rentang?.dari ?? "ta", rentang?.sampai ?? "ta"],
    queryFn: () => api<KepatuhanJurnal>(`pimpinan/kepatuhan-jurnal${parameterDari(rentang)}`),
  });

  function pintasan(jenis: "minggu-ini" | "bulan-ini" | "bulan-lalu" | "tahun") {
    const d = new Date();

    if (jenis === "tahun") {
      setRentang(null);
    } else if (jenis === "bulan-ini") {
      setRentang({ dari: awalBulan(d), sampai: akhirBulan(d) });
    } else if (jenis === "bulan-lalu") {
      const lalu = new Date(d.getFullYear(), d.getMonth() - 1, 1);
      setRentang({ dari: awalBulan(lalu), sampai: akhirBulan(lalu) });
    } else {
      const senin = new Date(d);
      senin.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      const jumat = new Date(senin);
      jumat.setDate(senin.getDate() + 4);
      setRentang({ dari: keIso(senin), sampai: keIso(jumat) });
    }
  }

  const guru = useMemo(() => {
    const cari = kata.trim().toLowerCase();

    return (q.data?.guru ?? [])
      .filter((g) => filter === "semua" || g.status === filter)
      .filter((g) => !cari || g.nama.toLowerCase().includes(cari) || (g.nip ?? "").includes(cari));
  }, [q.data, kata, filter]);

  const kolom = "mt-1 w-full rounded-2xl border border-gray-300 bg-white px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-orange-500";
  const d = q.data;
  const totalGuru = Math.max(1, (d?.ringkasan.baik ?? 0) + (d?.ringkasan.cukup ?? 0) + (d?.ringkasan.kurang ?? 0));

  return (
    <div className="space-y-5">
      <div>
        <Link href="/pimpinan" className="text-sm text-orange-600">← Kembali</Link>
        <h1 className="mt-1 text-2xl font-bold">Kepatuhan jurnal guru</h1>
        <p className="text-sm text-gray-500">
          Perbandingan sesi mengajar yang seharusnya dijurnal dengan jurnal yang benar-benar diisi.
        </p>
      </div>

      <section className="space-y-4 rounded-3xl border border-white/80 bg-white/70 p-5 backdrop-blur">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-gray-600">
            Dari tanggal
            <input
              type="date"
              value={rentang?.dari ?? d?.periode.dari ?? ""}
              onChange={(e) => setRentang({ dari: e.target.value, sampai: rentang?.sampai ?? d?.periode.sampai ?? e.target.value })}
              className={kolom}
            />
          </label>
          <label className="block text-sm font-medium text-gray-600">
            Sampai tanggal
            <input
              type="date"
              value={rentang?.sampai ?? d?.periode.sampai ?? ""}
              min={rentang?.dari ?? d?.periode.dari}
              onChange={(e) => setRentang({ dari: rentang?.dari ?? d?.periode.dari ?? e.target.value, sampai: e.target.value })}
              className={kolom}
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2 text-sm font-semibold">
          {[
            ["minggu-ini", "Minggu ini"],
            ["bulan-ini", "Bulan ini"],
            ["bulan-lalu", "Bulan lalu"],
            ["tahun", "Tahun ajaran"],
          ].map(([k, label]) => (
            <button
              key={k}
              onClick={() => pintasan(k as "minggu-ini" | "bulan-ini" | "bulan-lalu" | "tahun")}
              className="rounded-xl border border-orange-300 px-4 py-1.5 text-orange-700 hover:bg-orange-50"
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {q.isPending && <div className="h-48 animate-pulse rounded-3xl bg-gray-100" />}

      {q.isError && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-5">
          <p className="font-medium text-red-700">{q.error.message}</p>
        </div>
      )}

      {d && (
        <>
          <p className="text-sm text-gray-500">
            {d.periode.label} · dihitung sampai {labelTanggalPendek(d.periode.dihitung_sampai)} ({d.ringkasan.hari_efektif} hari
            efektif). Jurnal hari ini belum dihitung karena masih bisa diisi.
          </p>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Ringkas nilai={d.ringkasan.guru} label="Guru mengajar" kelas="bg-orange-50" teks="text-orange-700" />
            <Ringkas nilai={`${d.ringkasan.terisi}/${d.ringkasan.seharusnya}`} label="Jurnal terisi" kelas="bg-green-50" teks="text-green-700" />
            <Ringkas nilai={d.ringkasan.terlewat} label="Sesi terlewat" kelas="bg-red-50" teks="text-red-700" />
            <Ringkas nilai={teksPersen(d.ringkasan.persen)} label="Kepatuhan sekolah" kelas="bg-orange-50" teks={warnaTeks(d.ringkasan.persen)} />
          </div>

          {d.ringkasan.seharusnya === 0 ? (
            <p className="text-gray-500">Belum ada sesi yang perlu dijurnal pada periode ini.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <section className="space-y-3 rounded-3xl border border-white/80 bg-white/70 p-5 backdrop-blur">
                <h2 className="font-semibold">Sebaran guru</h2>
                <div className="flex h-7 overflow-hidden rounded-full bg-gray-200">
                  {(
                    [
                      ["baik", d.ringkasan.baik, "bg-green-600"],
                      ["cukup", d.ringkasan.cukup, "bg-amber-500"],
                      ["kurang", d.ringkasan.kurang, "bg-red-600"],
                    ] as const
                  ).map(([k, n, warna]) =>
                    n > 0 ? (
                      <div
                        key={k}
                        style={{ width: `${(n / totalGuru) * 100}%` }}
                        className={`flex items-center justify-center text-xs font-bold text-white ${warna}`}
                      >
                        {n}
                      </div>
                    ) : null,
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 text-xs text-gray-600">
                  <span><i className="mr-1 inline-block size-2 rounded-sm bg-green-600" />Baik (90% ke atas)</span>
                  <span><i className="mr-1 inline-block size-2 rounded-sm bg-amber-500" />Cukup (75-89%)</span>
                  <span><i className="mr-1 inline-block size-2 rounded-sm bg-red-600" />Kurang (di bawah 75%)</span>
                </div>
              </section>

              <section className="space-y-2 rounded-3xl border border-white/80 bg-white/70 p-5 backdrop-blur">
                <h2 className="font-semibold">Tren per minggu</h2>
                {d.mingguan.map((m) => (
                  <div key={m.label} className="grid grid-cols-[3.5rem_minmax(0,1fr)_2.5rem] items-center gap-2 text-sm">
                    <span>{m.label}</span>
                    <div className="h-2 rounded-full bg-gray-200">
                      <div className={`h-2 rounded-full ${warnaBatang(m.persen)}`} style={{ width: `${m.persen ?? 0}%` }} />
                    </div>
                    <span className={`text-right font-bold ${warnaTeks(m.persen)}`}>{teksPersen(m.persen)}</span>
                  </div>
                ))}
              </section>
            </div>
          )}

          {/* Daftar guru */}
          <section className="space-y-3">
            <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
              <input
                value={kata}
                onChange={(e) => setKata(e.target.value)}
                placeholder="Cari nama atau NIP guru…"
                className="rounded-2xl border border-gray-300 bg-white/80 px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-orange-500 md:text-sm"
              />
              <div className="grid grid-cols-4 gap-1 rounded-2xl bg-gray-100 p-1 text-sm font-semibold">
                {(["semua", "baik", "cukup", "kurang"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`rounded-xl px-3 py-1.5 capitalize ${filter === f ? "bg-white text-orange-600 shadow-sm" : "text-gray-500"}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-white/80 bg-white/80 backdrop-blur">
              <table className="w-full min-w-[46rem] text-left text-sm">
                <thead className="border-b border-gray-200 bg-orange-50/70 text-gray-600">
                  <tr>
                    <th className="px-3 py-2.5 font-semibold">No</th>
                    <th className="px-3 py-2.5 font-semibold">Guru</th>
                    <th className="px-3 py-2.5 text-center font-semibold">Seharusnya</th>
                    <th className="px-3 py-2.5 text-center font-semibold">Terisi</th>
                    <th className="px-3 py-2.5 text-center font-semibold">Terlewat</th>
                    <th className="px-3 py-2.5 font-semibold">Kepatuhan</th>
                    <th className="px-3 py-2.5 font-semibold">Terakhir mengisi</th>
                    <th className="px-3 py-2.5 font-semibold" />
                  </tr>
                </thead>
                <tbody>
                  {guru.map((g: GuruKepatuhan, i) => (
                    <tr
                      key={g.id}
                      onClick={() => setDetailId(g.id)}
                      className="cursor-pointer border-b border-gray-100 last:border-0 hover:bg-orange-50/50"
                    >
                      <td className="px-3 py-2.5 text-gray-400">{i + 1}</td>
                      <td className="px-3 py-2.5">
                        <p className="font-medium">{g.nama}</p>
                        <p className="text-xs text-gray-500">
                          {g.nip ?? "NIP belum diisi"} · {g.sesi_per_minggu} sesi/minggu
                        </p>
                      </td>
                      <td className="px-3 py-2.5 text-center">{g.seharusnya}</td>
                      <td className="px-3 py-2.5 text-center font-semibold text-green-700">{g.terisi}</td>
                      <td className={`px-3 py-2.5 text-center font-semibold ${g.terlewat > 0 ? "text-red-600" : "text-gray-300"}`}>
                        {g.terlewat || "–"}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 rounded-full bg-gray-200">
                            <div className={`h-2 rounded-full ${warnaBatang(g.persen)}`} style={{ width: `${g.persen ?? 0}%` }} />
                          </div>
                          <span className={`font-bold ${warnaTeks(g.persen)}`}>{teksPersen(g.persen)}</span>
                          {g.status && (
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${lencana[g.status]}`}>{g.status}</span>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-gray-500">
                        {g.terakhir_isi ? labelTanggalPendek(g.terakhir_isi) : "Belum pernah"}
                      </td>
                      <td className="px-3 py-2.5 text-sm font-semibold text-orange-600">Detail</td>
                    </tr>
                  ))}

                  {guru.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-3 py-8 text-center text-gray-500">
                        Tidak ada guru yang cocok.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {detailId !== null && (
        <Modal judul="Detail kepatuhan guru" tutup={() => setDetailId(null)}>
          <DetailGuru id={detailId} rentang={rentang} />
        </Modal>
      )}
    </div>
  );
}

function DetailGuru({ id, rentang }: { id: number; rentang: Rentang }) {
  const q = useQuery({
    queryKey: ["kepatuhan-jurnal-guru", id, rentang?.dari ?? "ta", rentang?.sampai ?? "ta"],
    queryFn: () => api<DetailKepatuhan>(`pimpinan/kepatuhan-jurnal/${id}${parameterDari(rentang)}`),
  });

  if (q.isPending) return <div className="h-40 animate-pulse rounded-2xl bg-gray-100" />;
  if (q.isError) return <p className="text-red-600">{q.error.message}</p>;

  const d = q.data;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-lg font-bold">{d.guru.nama}</p>
        <p className="text-sm text-gray-500">
          {d.guru.nip ?? "NIP belum diisi"} · {d.periode.label}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-green-50 py-2.5">
          <p className="text-xl font-bold text-green-700">{d.ringkasan.terisi}</p>
          <p className="text-xs text-gray-600">Terisi</p>
        </div>
        <div className="rounded-2xl bg-red-50 py-2.5">
          <p className="text-xl font-bold text-red-700">{d.ringkasan.terlewat}</p>
          <p className="text-xs text-gray-600">Terlewat</p>
        </div>
        <div className="rounded-2xl bg-orange-50 py-2.5">
          <p className={`text-xl font-bold ${warnaTeks(d.ringkasan.persen)}`}>{teksPersen(d.ringkasan.persen)}</p>
          <p className="text-xs text-gray-600">Kepatuhan</p>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-gray-600">Sesi yang belum dijurnal</p>

        {d.terlewat.length === 0 ? (
          <p className="text-sm text-green-700">Tidak ada sesi yang terlewat pada periode ini.</p>
        ) : (
          <ul className="space-y-2">
            {d.terlewat.map((s, i) => (
              <li key={`${s.tanggal}-${s.jam_ke_mulai}-${i}`} className="rounded-2xl border border-red-100 bg-red-50/50 p-3 text-sm">
                <p className="font-semibold text-red-700">
                  {s.hari}, {s.tanggal_label}
                </p>
                <p>
                  <b>{s.kelas ?? "-"}</b> · {s.mapel ?? "-"}
                </p>
                <p className="text-xs text-gray-500">
                  Jam ke-{s.jam_ke_mulai}
                  {s.jam_ke_selesai !== s.jam_ke_mulai ? `-${s.jam_ke_selesai}` : ""} · {s.jam_mulai} - {s.jam_selesai}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Ringkas({ nilai, label, kelas, teks }: { nilai: number | string; label: string; kelas: string; teks: string }) {
  return (
    <div className={`rounded-2xl py-3 text-center ${kelas}`}>
      <p className={`text-2xl font-bold ${teks}`}>{nilai}</p>
      <p className="text-xs text-gray-600">{label}</p>
    </div>
  );
}