"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { keIso } from "@/lib/tanggal";
import type { RekapSholat, SholatHitung } from "@/lib/types";

const awalBulan = (d: Date) => keIso(new Date(d.getFullYear(), d.getMonth(), 1));
const akhirBulan = (d: Date) => keIso(new Date(d.getFullYear(), d.getMonth() + 1, 0));

const teksPersen = (p: number | null) => (p === null ? "-" : `${p}%`);
const warnaTeks = (p: number | null) =>
  p === null ? "text-gray-400" : p >= 90 ? "text-green-700" : p >= 75 ? "text-amber-600" : "text-red-600";
const warnaBatang = (p: number | null) =>
  p === null ? "bg-gray-300" : p >= 90 ? "bg-green-600" : p >= 75 ? "bg-amber-500" : "bg-red-600";

const bagian = [
  ["hadir", "bg-green-600"],
  ["tidak_hadir", "bg-red-600"],
  ["berhalangan", "bg-amber-500"],
] as const;

export default function RekapSholatHalaman() {
  const [kelasId, setKelasId] = useState("");
  const [dari, setDari] = useState("");
  const [sampai, setSampai] = useState("");

  const kelas = useQuery({
    queryKey: ["rekap-sholat-kelas"],
    queryFn: () =>
      api<{
        tahun_ajaran: { nama: string; tanggal_mulai: string; tanggal_selesai: string };
        data: { id: number; nama: string }[];
      }>("rekap/sholat/kelas"),
  });

  const ta = kelas.data?.tahun_ajaran;
  const dariEf = dari || ta?.tanggal_mulai || "";
  const sampaiEf = sampai || ta?.tanggal_selesai || "";

  const sah = kelasId !== "" && dariEf !== "" && sampaiEf !== "" && dariEf <= sampaiEf;
  const parameter = `kelas_id=${kelasId}&dari=${dariEf}&sampai=${sampaiEf}`;

  const rekap = useQuery({
    queryKey: ["rekap-sholat", kelasId, dariEf, sampaiEf],
    queryFn: () => api<RekapSholat>(`rekap/sholat?${parameter}`),
    enabled: sah,
  });

  function pintasan(jenis: "bulan-ini" | "bulan-lalu" | "tahun") {
    const d = new Date();

    if (jenis === "tahun") {
      setDari("");
      setSampai("");
    } else if (jenis === "bulan-ini") {
      setDari(awalBulan(d));
      setSampai(akhirBulan(d));
    } else {
      const lalu = new Date(d.getFullYear(), d.getMonth() - 1, 1);
      setDari(awalBulan(lalu));
      setSampai(akhirBulan(lalu));
    }
  }

  const kolom = "mt-1 w-full rounded-2xl border border-gray-300 bg-white px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-orange-500";

  const d = rekap.data;
  const maksTidak = Math.max(1, ...(d?.terbanyak_tidak_hadir.map((s) => s.jumlah) ?? [0]));

  return (
    <div className="space-y-5">
      <div>
        <Link href="/rekap" className="text-sm text-orange-600">← Kembali</Link>
        <h1 className="mt-1 text-2xl font-bold">Rekap sholat</h1>
        <p className="text-sm text-gray-500">
          Kehadiran sholat Dhuhur dan Ashar per kelas. Berhalangan tidak dihitung dalam persentase.
        </p>
      </div>

      {kelas.isPending && <div className="h-32 animate-pulse rounded-3xl bg-gray-100" />}

      {kelas.isError && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-5">
          <p className="font-medium text-red-700">{kelas.error.message}</p>
        </div>
      )}

      {kelas.data && kelas.data.data.length === 0 && (
        <div className="rounded-3xl border border-amber-300 bg-amber-50 p-5 text-sm">
          Rekap sholat hanya tersedia untuk wali kelas, kesiswaan, kepala sekolah, dan admin. Anda tidak menjadi wali
          kelas pada tahun ajaran aktif.
        </div>
      )}

      {kelas.data && kelas.data.data.length > 0 && (
        <section className="space-y-4 rounded-3xl border border-white/80 bg-white/70 p-5 backdrop-blur">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="block text-sm font-medium text-gray-600">
              Kelas
              <select value={kelasId} onChange={(e) => setKelasId(e.target.value)} className={kolom}>
                <option value="">Pilih kelas</option>
                {kelas.data.data.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium text-gray-600">
              Dari tanggal
              <input type="date" value={dariEf} onChange={(e) => setDari(e.target.value)} className={kolom} />
            </label>

            <label className="block text-sm font-medium text-gray-600">
              Sampai tanggal
              <input type="date" value={sampaiEf} min={dariEf} onChange={(e) => setSampai(e.target.value)} className={kolom} />
            </label>
          </div>

          <div className="flex flex-wrap gap-2 text-sm font-semibold">
            {[
              ["tahun", "Tahun ajaran"],
              ["bulan-ini", "Bulan ini"],
              ["bulan-lalu", "Bulan lalu"],
            ].map(([k, label]) => (
              <button
                key={k}
                onClick={() => pintasan(k as "bulan-ini" | "bulan-lalu" | "tahun")}
                className="rounded-xl border border-orange-300 px-4 py-1.5 text-orange-700 hover:bg-orange-50"
              >
                {label}
              </button>
            ))}
          </div>

          {dariEf > sampaiEf && <p className="text-sm text-red-600">Tanggal akhir tidak boleh lebih awal dari tanggal awal.</p>}
        </section>
      )}

      {kelas.data && kelas.data.data.length > 0 && !kelasId && (
        <p className="text-gray-500">Pilih kelas untuk melihat rekap sholatnya.</p>
      )}

      {sah && rekap.isPending && <div className="h-48 animate-pulse rounded-3xl bg-gray-100" />}

      {rekap.isError && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-5">
          <p className="font-medium text-red-700">{rekap.error.message}</p>
        </div>
      )}

      {d && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">
                {d.kelas.nama} · Wali kelas {d.wali?.nama ?? "-"}
              </p>
              <p className="text-sm text-gray-500">{d.periode.label}</p>
            </div>

            <a
              href={`/api/proxy/rekap/sholat/pdf?${parameter}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Unduh PDF
            </a>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <Ringkas nilai={d.ringkasan.peserta} label="Peserta" kelas="bg-orange-50" teks="text-orange-700" />
            <Ringkas nilai={d.ringkasan.hari_tercatat} label="Hari tercatat" kelas="bg-orange-50" teks="text-orange-700" />
            <Ringkas nilai={teksPersen(d.ringkasan.persen_dhuhur)} label="Hadir Dhuhur" kelas="bg-green-50" teks={warnaTeks(d.ringkasan.persen_dhuhur)} />
            <Ringkas nilai={teksPersen(d.ringkasan.persen_ashar)} label="Hadir Ashar" kelas="bg-green-50" teks={warnaTeks(d.ringkasan.persen_ashar)} />
            <Ringkas nilai={teksPersen(d.ringkasan.persen)} label="Rata-rata hadir" kelas="bg-green-50" teks={warnaTeks(d.ringkasan.persen)} />
          </div>

          {d.ringkasan.hari_tercatat === 0 ? (
            <p className="text-gray-500">Belum ada absensi sholat pada periode ini.</p>
          ) : (
            <>
              <section className="space-y-3 rounded-3xl border border-white/80 bg-white/70 p-5 backdrop-blur">
                <h2 className="font-semibold">Kehadiran per waktu sholat</h2>

                {(["dhuhur", "ashar"] as const).map((w) => {
                  const x: SholatHitung = d.waktu[w];
                  const total = x.hadir + x.tidak_hadir + x.berhalangan;

                  return (
                    <div key={w} className="grid grid-cols-[4rem_minmax(0,1fr)] items-center gap-2 text-sm">
                      <span className="font-semibold capitalize">{w}</span>
                      <div className="flex h-6 overflow-hidden rounded-full bg-gray-200">
                        {total > 0 &&
                          bagian.map(([k, warna]) =>
                            x[k] > 0 ? (
                              <div
                                key={k}
                                style={{ width: `${(x[k] / total) * 100}%` }}
                                className={`flex items-center justify-center text-[11px] font-bold text-white ${warna}`}
                              >
                                {x[k]}
                              </div>
                            ) : null,
                          )}
                      </div>
                    </div>
                  );
                })}

                <div className="flex flex-wrap gap-x-4 text-xs text-gray-600">
                  <span><i className="mr-1 inline-block size-2 rounded-sm bg-green-600" />Hadir</span>
                  <span><i className="mr-1 inline-block size-2 rounded-sm bg-red-600" />Tidak hadir</span>
                  <span><i className="mr-1 inline-block size-2 rounded-sm bg-amber-500" />Berhalangan</span>
                </div>
              </section>

              <div className="grid gap-4 md:grid-cols-2">
                <section className="space-y-2 rounded-3xl border border-white/80 bg-white/70 p-5 backdrop-blur">
                  <h2 className="font-semibold">Tren kehadiran per bulan</h2>
                  {d.per_bulan.map((b) => (
                    <div key={b.label} className="grid grid-cols-[4.5rem_minmax(0,1fr)_2.5rem] items-center gap-2 text-sm">
                      <span>{b.label}</span>
                      <div className="h-2 rounded-full bg-gray-200">
                        <div className={`h-2 rounded-full ${warnaBatang(b.persen)}`} style={{ width: `${b.persen ?? 0}%` }} />
                      </div>
                      <span className={`text-right font-bold ${warnaTeks(b.persen)}`}>{teksPersen(b.persen)}</span>
                    </div>
                  ))}
                </section>

                <section className="space-y-2 rounded-3xl border border-white/80 bg-white/70 p-5 backdrop-blur">
                  <h2 className="font-semibold">Paling sering tidak hadir</h2>
                  {d.terbanyak_tidak_hadir.length === 0 && <p className="text-sm text-gray-500">Tidak ada siswa yang tidak hadir.</p>}
                  {d.terbanyak_tidak_hadir.map((s) => (
                    <div key={s.nama} className="grid grid-cols-[minmax(0,1fr)_6rem_2.5rem] items-center gap-2 text-sm">
                      <span className="truncate" title={s.nama}>{s.nama}</span>
                      <div className="h-2 rounded-full bg-gray-200">
                        <div className="h-2 rounded-full bg-red-500" style={{ width: `${(s.jumlah / maksTidak) * 100}%` }} />
                      </div>
                      <span className="text-right font-bold text-red-600">{s.jumlah}x</span>
                    </div>
                  ))}
                </section>
              </div>
            </>
          )}

          <div className="overflow-x-auto rounded-3xl border border-white/80 bg-white/80 backdrop-blur">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="border-b border-gray-200 bg-orange-50/70 text-gray-600">
                <tr>
                  <th rowSpan={2} className="px-3 py-2.5 font-semibold">No</th>
                  <th rowSpan={2} className="px-3 py-2.5 font-semibold">Nama siswa</th>
                  <th colSpan={3} className="border-l border-gray-200 px-3 py-1.5 text-center font-semibold">Dhuhur</th>
                  <th colSpan={3} className="border-l border-gray-200 px-3 py-1.5 text-center font-semibold">Ashar</th>
                  <th rowSpan={2} className="border-l border-gray-200 px-3 py-2.5 font-semibold">Kehadiran</th>
                </tr>
                <tr className="text-xs">
                  {["H", "T", "B", "H", "T", "B"].map((x, i) => (
                    <th key={i} className={`px-2 pb-1.5 text-center ${i % 3 === 0 ? "border-l border-gray-200" : ""}`}>{x}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.siswa.map((s, i) => (
                  <tr key={s.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-3 py-2.5 text-gray-400">{i + 1}</td>
                    <td className="px-3 py-2.5">
                      <p className="font-medium">{s.nama}</p>
                      <p className="text-xs text-gray-500">{s.nis}</p>
                    </td>
                    {(["dhuhur", "ashar"] as const).map((w) => (
                      <HitungSel key={w} x={s[w]} />
                    ))}
                    <td className="border-l border-gray-200 px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 rounded-full bg-gray-200">
                          <div className={`h-2 rounded-full ${warnaBatang(s.persen)}`} style={{ width: `${s.persen ?? 0}%` }} />
                        </div>
                        <span className={`font-bold ${warnaTeks(s.persen)}`}>{teksPersen(s.persen)}</span>
                      </div>
                    </td>
                  </tr>
                ))}

                {d.siswa.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-3 py-8 text-center text-gray-500">
                      Kelas ini belum punya siswa muslim aktif.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-gray-500">
            H hadir · T tidak hadir · B berhalangan. Persentase = hadir dibagi (hadir + tidak hadir). Siswa yang sakit,
            izin, atau alpa pada absensi pagi tidak ikut dihitung pada hari itu.
          </p>
        </>
      )}
    </div>
  );
}

function HitungSel({ x }: { x: SholatHitung }) {
  return (
    <>
      <td className="border-l border-gray-200 px-2 py-2.5 text-center font-semibold text-green-700">{x.hadir || "–"}</td>
      <td className="px-2 py-2.5 text-center font-semibold text-red-600">{x.tidak_hadir || "–"}</td>
      <td className="px-2 py-2.5 text-center text-amber-600">{x.berhalangan || "–"}</td>
    </>
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