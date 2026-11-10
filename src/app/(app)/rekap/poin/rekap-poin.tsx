"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { keIso } from "@/lib/tanggal";
import type { JadwalSaya, KelasRekap, RekapPoin } from "@/lib/types";

const awalBulan = (d: Date) => keIso(new Date(d.getFullYear(), d.getMonth(), 1));
const akhirBulan = (d: Date) => keIso(new Date(d.getFullYear(), d.getMonth() + 1, 0));

const warnaKategori: Record<string, string> = {
  ringan: "bg-green-600",
  sedang: "bg-amber-500",
  berat: "bg-red-600",
  lainnya: "bg-gray-500",
};

const warnaLevel = ["bg-green-600", "bg-amber-500", "bg-orange-500", "bg-red-600"];
const teksLevel = ["text-green-700", "text-amber-600", "text-orange-600", "text-red-600"];

const labelStatus: Record<string, string> = {
  menunggu: "Menunggu",
  disetujui: "Disetujui",
  ditolak: "Ditolak",
};

export default function RekapPoinHalaman() {
  const [kelasId, setKelasId] = useState("");
  const [dari, setDari] = useState("");
  const [sampai, setSampai] = useState("");
  const [sertakanNol, setSertakanNol] = useState(false);

  const daftarKelas = useQuery({
    queryKey: ["rekap-kelas"],
    queryFn: () => api<{ data: KelasRekap[] }>("rekap/kelas"),
  });

  // Batas tahun ajaran dipakai sebagai periode awal
  const saya = useQuery({
    queryKey: ["jadwal-saya"],
    queryFn: () => api<JadwalSaya>("jadwal/saya"),
    staleTime: 5 * 60_000,
  });

  const ta = saya.data?.tahun_ajaran;
  const dariEf = dari || ta?.tanggal_mulai || "";
  const sampaiEf = sampai || ta?.tanggal_selesai || "";

  const sah = kelasId !== "" && dariEf !== "" && sampaiEf !== "" && dariEf <= sampaiEf;

  const parameter = `kelas_id=${kelasId}&dari=${dariEf}&sampai=${sampaiEf}&sertakan_nol=${sertakanNol ? 1 : 0}`;

  const rekap = useQuery({
    queryKey: ["rekap-poin", kelasId, dariEf, sampaiEf, sertakanNol],
    queryFn: () => api<RekapPoin>(`rekap/poin?${parameter}`),
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
  const totalKejadian = Math.max(1, d?.ringkasan.kejadian ?? 1);
  const batasMaks = Math.max(1, ...(d?.aturan.map((a) => a.batas_poin) ?? [0]), ...(d?.siswa.map((s) => s.poin_aktif) ?? [0]));
  const maksJenis = Math.max(1, ...(d?.jenis_terbanyak.map((j) => j.jumlah) ?? [0]));
  const maksBulan = Math.max(1, ...(d?.per_bulan.map((b) => b.jumlah) ?? [0]));

  return (
    <div className="space-y-5">
      <div>
        <Link href="/rekap" className="text-sm text-orange-600">← Kembali</Link>
        <h1 className="mt-1 text-2xl font-bold">Rekap poin pelanggaran</h1>
        <p className="text-sm text-gray-500">Poin, remisi, dan status SP siswa per kelas.</p>
      </div>

      <section className="space-y-4 rounded-3xl border border-white/80 bg-white/70 p-5 backdrop-blur">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="block text-sm font-medium text-gray-600">
            Kelas
            <select value={kelasId} onChange={(e) => setKelasId(e.target.value)} className={kolom}>
              <option value="">{daftarKelas.isPending ? "Memuat kelas…" : "Pilih kelas"}</option>
              {daftarKelas.data?.data.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama} ({k.jumlah_siswa} siswa)
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

        <div className="flex flex-wrap items-center justify-between gap-3">
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

          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={sertakanNol}
              onChange={(e) => setSertakanNol(e.target.checked)}
              className="size-4 accent-orange-600"
            />
            Sertakan siswa tanpa poin
          </label>
        </div>

        {dariEf > sampaiEf && <p className="text-sm text-red-600">Tanggal akhir tidak boleh lebih awal dari tanggal awal.</p>}
      </section>

      {!kelasId && <p className="text-gray-500">Pilih kelas untuk melihat rekap poinnya.</p>}

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
              href={`/api/proxy/rekap/poin/pdf?${parameter}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Unduh PDF
            </a>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <Ringkas nilai={d.ringkasan.kejadian} label="Pelanggaran dicatat" kelas="bg-orange-50 text-orange-700" />
            <Ringkas nilai={d.ringkasan.poin_pelanggaran} label="Total poin" kelas="bg-red-50 text-red-700" />
            <Ringkas nilai={d.ringkasan.remisi} label="Total remisi" kelas="bg-green-50 text-green-700" />
            <Ringkas
              nilai={`${d.ringkasan.siswa_bermasalah}/${d.ringkasan.jumlah_siswa}`}
              label="Siswa melanggar"
              kelas="bg-amber-50 text-amber-700"
            />
            <Ringkas nilai={d.ringkasan.siswa_sp} label="Siswa terkena SP" kelas="bg-red-50 text-red-700" />
          </div>

          {d.ringkasan.kejadian === 0 ? (
            <p className="text-gray-500">Tidak ada pelanggaran pada periode ini.</p>
          ) : (
            <>
              {/* Kategori */}
              <section className="space-y-2 rounded-3xl border border-white/80 bg-white/70 p-5 backdrop-blur">
                <h2 className="font-semibold">Kategori pelanggaran</h2>
                <div className="flex h-7 overflow-hidden rounded-full">
                  {d.kategori.map((k) => (
                    <div
                      key={k.kategori}
                      style={{ width: `${(k.jumlah / totalKejadian) * 100}%` }}
                      className={`flex items-center justify-center text-xs font-bold text-white ${warnaKategori[k.kategori] ?? "bg-gray-500"}`}
                    >
                      {(k.jumlah / totalKejadian) * 100 >= 12 ? `${k.kategori} ${k.jumlah}` : ""}
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-x-4 text-xs text-gray-600">
                  {d.kategori.map((k) => (
                    <span key={k.kategori} className="capitalize">
                      <i className={`mr-1 inline-block size-2 rounded-sm ${warnaKategori[k.kategori] ?? "bg-gray-500"}`} />
                      {k.kategori}: {k.jumlah} kejadian ({k.poin} poin)
                    </span>
                  ))}
                </div>
              </section>

              <div className="grid gap-4 md:grid-cols-2">
                <section className="space-y-2 rounded-3xl border border-white/80 bg-white/70 p-5 backdrop-blur">
                  <h2 className="font-semibold">Pelanggaran terbanyak</h2>
                  {d.jenis_terbanyak.map((j) => (
                    <div key={j.nama} className="grid grid-cols-[minmax(0,1fr)_6rem_2.5rem] items-center gap-2 text-sm">
                      <span className="truncate" title={j.nama}>{j.nama}</span>
                      <div className="h-2 rounded-full bg-gray-200">
                        <div className="h-2 rounded-full bg-orange-500" style={{ width: `${(j.jumlah / maksJenis) * 100}%` }} />
                      </div>
                      <span className="text-right font-bold">{j.jumlah}x</span>
                    </div>
                  ))}
                </section>

                <section className="space-y-2 rounded-3xl border border-white/80 bg-white/70 p-5 backdrop-blur">
                  <h2 className="font-semibold">Tren per bulan</h2>
                  {d.per_bulan.map((b) => (
                    <div key={b.label} className="grid grid-cols-[4.5rem_minmax(0,1fr)_2rem] items-center gap-2 text-sm">
                      <span>{b.label}</span>
                      <div className="h-2 rounded-full bg-gray-200">
                        <div className="h-2 rounded-full bg-red-500" style={{ width: `${(b.jumlah / maksBulan) * 100}%` }} />
                      </div>
                      <span className="text-right font-bold">{b.jumlah}</span>
                    </div>
                  ))}
                </section>
              </div>
            </>
          )}

          {/* Tabel siswa */}
          <div className="overflow-x-auto rounded-3xl border border-white/80 bg-white/80 backdrop-blur">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="border-b border-gray-200 bg-orange-50/70 text-gray-600">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">No</th>
                  <th className="px-3 py-2.5 font-semibold">Nama siswa</th>
                  <th className="px-3 py-2.5 text-center font-semibold">Kejadian</th>
                  <th className="px-3 py-2.5 text-center font-semibold">Poin</th>
                  <th className="px-3 py-2.5 text-center font-semibold">Remisi</th>
                  <th className="px-3 py-2.5 font-semibold">Poin aktif</th>
                  <th className="px-3 py-2.5 font-semibold">SP</th>
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
                    <td className="px-3 py-2.5 text-center">{s.kejadian || "–"}</td>
                    <td className="px-3 py-2.5 text-center">{s.poin_pelanggaran || "–"}</td>
                    <td className="px-3 py-2.5 text-center text-green-700">{s.remisi || "–"}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-28 rounded-full bg-gray-200">
                          <div
                            className={`h-2 rounded-full ${warnaLevel[Math.min(s.level, 3)]}`}
                            style={{ width: `${Math.min(100, (s.poin_aktif / batasMaks) * 100)}%` }}
                          />
                        </div>
                        <span className={`font-bold ${teksLevel[Math.min(s.level, 3)]}`}>{s.poin_aktif}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      {s.sp ? (
                        <span className={`font-semibold ${teksLevel[Math.min(s.sp.level, 3)]}`}>
                          {s.sp.nama}
                          <span className="ml-1 text-xs font-normal text-gray-500">{labelStatus[s.sp.status] ?? s.sp.status}</span>
                        </span>
                      ) : (
                        "–"
                      )}
                    </td>
                  </tr>
                ))}

                {d.siswa.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                      Tidak ada siswa yang melanggar pada periode ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-gray-500">
            Poin aktif = poin pelanggaran dikurangi remisi pada periode ini (minimal 0). Warna batang mengikuti ambang SP:{" "}
            {d.aturan.map((a) => `${a.nama} ≥ ${a.batas_poin}`).join(" · ")}. Status SP dari usulan SP tahun ajaran berjalan.
          </p>
        </>
      )}
    </div>
  );
}

function Ringkas({ nilai, label, kelas }: { nilai: number | string; label: string; kelas: string }) {
  return (
    <div className={`rounded-2xl py-3 text-center ${kelas}`}>
      <p className="text-2xl font-bold">{nilai}</p>
      <p className="text-xs text-gray-600">{label}</p>
    </div>
  );
}