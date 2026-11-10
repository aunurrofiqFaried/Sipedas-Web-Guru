"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { keIso } from "@/lib/tanggal";
import type { JadwalSaya, RekapJurnal } from "@/lib/types";

const awalBulan = (d: Date) => keIso(new Date(d.getFullYear(), d.getMonth(), 1));
const akhirBulan = (d: Date) => keIso(new Date(d.getFullYear(), d.getMonth() + 1, 0));

export default function RekapJurnalHalaman() {
  const sekarang = new Date();

  const [mapelId, setMapelId] = useState("");
  const [kelasId, setKelasId] = useState("");
  const [dari, setDari] = useState(awalBulan(sekarang));
  const [sampai, setSampai] = useState(keIso(sekarang));

  const saya = useQuery({
    queryKey: ["jadwal-saya"],
    queryFn: () => api<JadwalSaya>("jadwal/saya"),
    staleTime: 5 * 60_000,
  });

  // Pilihan mapel: hanya yang diajar guru ini
  const opsiMapel = useMemo(() => {
    const peta = new Map<number, string>();

    for (const s of saya.data?.data ?? []) {
      if (s.mapel) peta.set(s.mapel.id, s.mapel.nama);
    }

    return [...peta.entries()].sort((a, b) => a[1].localeCompare(b[1], "id"));
  }, [saya.data]);

  // Pilihan kelas: hanya kelas tempat guru ini mengajar mapel terpilih
  const opsiKelas = useMemo(() => {
    const peta = new Map<number, string>();

    for (const s of saya.data?.data ?? []) {
      if (s.kelas && String(s.mapel?.id) === mapelId) peta.set(s.kelas.id, s.kelas.nama);
    }

    return [...peta.entries()].sort((a, b) => a[1].localeCompare(b[1], "id"));
  }, [saya.data, mapelId]);

  const sah = mapelId !== "" && dari !== "" && sampai !== "" && dari <= sampai;

  const parameter = `mapel_id=${mapelId}${kelasId ? `&kelas_id=${kelasId}` : ""}&dari=${dari}&sampai=${sampai}`;

  const rekap = useQuery({
    queryKey: ["rekap-jurnal", mapelId, kelasId, dari, sampai],
    queryFn: () => api<RekapJurnal>(`rekap/jurnal?${parameter}`),
    enabled: sah,
  });

  function pintasan(jenis: "bulan-ini" | "bulan-lalu" | "tahun") {
    const d = new Date();

    if (jenis === "bulan-ini") {
      setDari(awalBulan(d));
      setSampai(keIso(d));
    } else if (jenis === "bulan-lalu") {
      const lalu = new Date(d.getFullYear(), d.getMonth() - 1, 1);
      setDari(awalBulan(lalu));
      setSampai(akhirBulan(lalu));
    } else if (saya.data) {
      const ta = saya.data.tahun_ajaran;
      setDari(ta.tanggal_mulai);
      setSampai(keIso(d) < ta.tanggal_selesai ? keIso(d) : ta.tanggal_selesai);
    }
  }

  const kolom = "mt-1 w-full rounded-2xl border border-gray-300 bg-white px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-orange-500";

  return (
    <div className="space-y-5">
      <div>
        <Link href="/rekap" className="text-sm text-orange-600">← Kembali</Link>
        <h1 className="mt-1 text-2xl font-bold">Rekap jurnal</h1>
        <p className="text-sm text-gray-500">Jurnal kegiatan guru per mata pelajaran, kelas, dan periode.</p>
      </div>

      {/* Pilihan */}
      <section className="space-y-4 rounded-3xl border border-white/80 bg-white/70 p-5 backdrop-blur">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-gray-600">
            Mata pelajaran
            <select
              value={mapelId}
              onChange={(e) => {
                setMapelId(e.target.value);
                setKelasId("");
              }}
              className={kolom}
            >
              <option value="">{saya.isPending ? "Memuat…" : "Pilih mata pelajaran"}</option>
              {opsiMapel.map(([id, nama]) => (
                <option key={id} value={id}>
                  {nama}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-gray-600">
            Kelas
            <select value={kelasId} onChange={(e) => setKelasId(e.target.value)} disabled={!mapelId} className={kolom}>
              <option value="">Semua kelas yang diampu</option>
              {opsiKelas.map(([id, nama]) => (
                <option key={id} value={id}>
                  {nama}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-gray-600">
            Dari tanggal
            <input type="date" value={dari} onChange={(e) => setDari(e.target.value)} className={kolom} />
          </label>

          <label className="block text-sm font-medium text-gray-600">
            Sampai tanggal
            <input type="date" value={sampai} min={dari} onChange={(e) => setSampai(e.target.value)} className={kolom} />
          </label>
        </div>

        <div className="flex flex-wrap gap-2 text-sm font-semibold">
          {[
            ["bulan-ini", "Bulan ini"],
            ["bulan-lalu", "Bulan lalu"],
            ["tahun", "Tahun ajaran"],
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

        {dari > sampai && <p className="text-sm text-red-600">Tanggal akhir tidak boleh lebih awal dari tanggal awal.</p>}
      </section>

      {!mapelId && <p className="text-gray-500">Pilih mata pelajaran untuk menampilkan jurnalnya.</p>}

      {sah && rekap.isPending && <div className="h-40 animate-pulse rounded-3xl bg-gray-100" />}

      {rekap.isError && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-5">
          <p className="font-medium text-red-700">{rekap.error.message}</p>
        </div>
      )}

      {rekap.data && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">
                {rekap.data.mapel.nama} · {rekap.data.kelas?.nama ?? "Semua kelas"}
              </p>
              <p className="text-sm text-gray-500">{rekap.data.periode.label}</p>
            </div>

            {rekap.data.baris.length > 0 ? (
              <a
                href={`/api/proxy/rekap/jurnal/pdf?${parameter}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white"
              >
                Unduh PDF
              </a>
            ) : (
              <span className="rounded-2xl bg-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-400">Unduh PDF</span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-orange-50 py-3 text-center">
              <p className="text-2xl font-bold text-orange-700">{rekap.data.ringkasan.pertemuan}</p>
              <p className="text-xs text-gray-600">Pertemuan</p>
            </div>
            <div className="rounded-2xl bg-orange-50 py-3 text-center">
              <p className="text-2xl font-bold text-orange-700">{rekap.data.ringkasan.jam_pelajaran}</p>
              <p className="text-xs text-gray-600">Jam pelajaran</p>
            </div>
            <div className="rounded-2xl bg-green-50 py-3 text-center">
              <p className="text-2xl font-bold text-green-700">
                {rekap.data.ringkasan.rata_kehadiran !== null ? `${rekap.data.ringkasan.rata_kehadiran}%` : "-"}
              </p>
              <p className="text-xs text-gray-600">Rata-rata hadir</p>
            </div>
          </div>

          {/* Pratinjau tabel */}
          <div className="overflow-x-auto rounded-3xl border border-white/80 bg-white/80 backdrop-blur">
            <table className="w-full min-w-[56rem] text-left text-sm">
              <thead className="border-b border-gray-200 bg-orange-50/70 text-gray-600">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">No</th>
                  <th className="px-3 py-2.5 font-semibold">Hari / Tanggal</th>
                  <th className="px-3 py-2.5 font-semibold">Kelas / Konsentrasi</th>
                  <th className="px-3 py-2.5 text-center font-semibold">Jam</th>
                  <th className="px-3 py-2.5 text-center font-semibold">Hadir</th>
                  <th className="px-3 py-2.5 text-center font-semibold">Absen</th>
                  <th className="px-3 py-2.5 text-center font-semibold">Jml</th>
                  <th className="px-3 py-2.5 font-semibold">Tidak hadir</th>
                  <th className="px-3 py-2.5 font-semibold">Kegiatan / isi jurnal</th>
                </tr>
              </thead>
              <tbody>
                {rekap.data.baris.map((b, i) => (
                  <tr key={b.id} className="border-b border-gray-100 align-top last:border-0">
                    <td className="px-3 py-2.5 text-gray-400">{i + 1}</td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <p className="font-medium">{b.hari}</p>
                      <p className="text-xs text-gray-500">{b.tanggal_label}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="font-medium">{b.kelas ?? "-"}</p>
                      <p className="text-xs text-gray-500">{b.konsentrasi ?? ""}</p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-center">
                      {b.jam_ke_mulai !== null
                        ? `${b.jam_ke_mulai}${b.jam_ke_selesai !== b.jam_ke_mulai ? `-${b.jam_ke_selesai}` : ""}`
                        : "-"}
                    </td>
                    <td className="px-3 py-2.5 text-center font-semibold text-green-700">{b.hadir ?? "–"}</td>
                    <td className="px-3 py-2.5 text-center font-semibold text-red-700">{b.tidak_hadir ?? "–"}</td>
                    <td className="px-3 py-2.5 text-center">{b.jumlah_siswa || "–"}</td>
                    <td className="max-w-[10rem] px-3 py-2.5 text-gray-600">
                      {b.nama_tidak_hadir.length > 0 ? b.nama_tidak_hadir.join(", ") : "–"}
                    </td>
                    <td className="max-w-xs px-3 py-2.5">
                      <p className="whitespace-pre-line">{b.materi}</p>
                      {b.catatan && <p className="mt-0.5 text-xs italic text-gray-500">Catatan: {b.catatan}</p>}
                    </td>
                  </tr>
                ))}

                {rekap.data.baris.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-3 py-8 text-center text-gray-500">
                      Tidak ada jurnal untuk pilihan ini pada periode tersebut.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-gray-500">
            Presensi diambil dari absensi harian kelas pada tanggal jurnal; tanda – berarti absensi hari itu belum diisi.
            Kolom paraf ada di PDF dan dikosongkan untuk tanda tangan.
          </p>
        </>
      )}
    </div>
  );
}