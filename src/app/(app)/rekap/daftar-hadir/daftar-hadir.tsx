"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { keIso } from "@/lib/tanggal";
import type { JadwalSaya, RekapDaftarHadir } from "@/lib/types";

const awalBulan = (d: Date) => keIso(new Date(d.getFullYear(), d.getMonth(), 1));
const akhirBulan = (d: Date) => keIso(new Date(d.getFullYear(), d.getMonth() + 1, 0));

function Tanda({ kode }: { kode: string }) {
  if (kode === "H") return <span className="text-[10px] text-green-700">●</span>;
  if (kode === "S") return <span className="font-bold text-amber-600">S</span>;
  if (kode === "I") return <span className="font-bold text-sky-600">I</span>;
  if (kode === "A") return <span className="font-bold text-red-600">A</span>;
  return null;
}

export default function DaftarHadirHalaman() {
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

  const opsiMapel = useMemo(() => {
    const peta = new Map<number, string>();

    for (const s of saya.data?.data ?? []) {
      if (s.mapel) peta.set(s.mapel.id, s.mapel.nama);
    }

    return [...peta.entries()].sort((a, b) => a[1].localeCompare(b[1], "id"));
  }, [saya.data]);

  const opsiKelas = useMemo(() => {
    const peta = new Map<number, string>();

    for (const s of saya.data?.data ?? []) {
      if (s.kelas && String(s.mapel?.id) === mapelId) peta.set(s.kelas.id, s.kelas.nama);
    }

    return [...peta.entries()].sort((a, b) => a[1].localeCompare(b[1], "id"));
  }, [saya.data, mapelId]);

  const sah = mapelId !== "" && kelasId !== "" && dari !== "" && sampai !== "" && dari <= sampai;

  const parameter = `mapel_id=${mapelId}&kelas_id=${kelasId}&dari=${dari}&sampai=${sampai}`;

  const rekap = useQuery({
    queryKey: ["rekap-daftar-hadir", mapelId, kelasId, dari, sampai],
    queryFn: () => api<RekapDaftarHadir>(`rekap/daftar-hadir?${parameter}`),
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
        <h1 className="mt-1 text-2xl font-bold">Daftar hadir</h1>
        <p className="text-sm text-gray-500">
          Daftar hadir siswa per mata pelajaran dan kelas. Kolom tanggal mengikuti jurnal mengajarmu.
        </p>
      </div>

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
              <option value="">Pilih kelas</option>
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

      {!sah && dari <= sampai && <p className="text-gray-500">Pilih mata pelajaran dan kelas untuk menampilkan daftar hadir.</p>}

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
                {rekap.data.mapel.nama} · {rekap.data.kelas.nama}
                {rekap.data.kelas.konsentrasi ? ` / ${rekap.data.kelas.konsentrasi}` : ""}
              </p>
              <p className="text-sm text-gray-500">
                {rekap.data.periode.label} · Semester {rekap.data.semester}
              </p>
            </div>

            <a
              href={`/api/proxy/rekap/daftar-hadir/pdf?${parameter}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Unduh PDF
            </a>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-orange-50 py-3 text-center">
              <p className="text-2xl font-bold text-orange-700">{rekap.data.ringkasan.pertemuan}</p>
              <p className="text-xs text-gray-600">Pertemuan</p>
            </div>
            <div className="rounded-2xl bg-orange-50 py-3 text-center">
              <p className="text-2xl font-bold text-orange-700">{rekap.data.ringkasan.jumlah_siswa}</p>
              <p className="text-xs text-gray-600">Siswa</p>
            </div>
            <div className="rounded-2xl bg-green-50 py-3 text-center">
              <p className="text-2xl font-bold text-green-700">
                {rekap.data.ringkasan.rata_kehadiran !== null ? `${rekap.data.ringkasan.rata_kehadiran}%` : "-"}
              </p>
              <p className="text-xs text-gray-600">Rata-rata hadir</p>
            </div>
          </div>

          {rekap.data.ringkasan.pertemuan === 0 && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm">
              Belum ada jurnal untuk mapel dan kelas ini pada periode tersebut. PDF tetap bisa diunduh sebagai
              <b> formulir kosong</b> untuk diisi tangan.
            </div>
          )}

          <div className="overflow-x-auto rounded-3xl border border-white/80 bg-white/80 backdrop-blur">
            <table className="min-w-full border-collapse text-xs">
              <thead className="bg-orange-50/80 text-gray-600">
                <tr>
                  <th className="sticky left-0 z-10 w-10 bg-orange-50 px-2 py-2 text-left font-semibold">No</th>
                  <th className="sticky left-10 z-10 min-w-44 bg-orange-50 px-2 py-2 text-left font-semibold">Nama siswa</th>
                  <th className="px-2 py-2 font-semibold">L/P</th>
                  {rekap.data.kolom.map((k, i) => (
                    <th key={k.tanggal} className="min-w-9 px-1 py-2 text-center">
                      <span className="block font-bold">{i + 1}</span>
                      <span className="block text-[10px] font-normal text-gray-500">{k.label}</span>
                    </th>
                  ))}
                  <th className="px-2 py-2 text-center text-green-700">H</th>
                  <th className="px-2 py-2 text-center text-amber-700">S</th>
                  <th className="px-2 py-2 text-center text-sky-700">I</th>
                  <th className="px-2 py-2 text-center text-red-700">A</th>
                </tr>
              </thead>
              <tbody>
                {rekap.data.siswa.map((s, i) => (
                  <tr key={s.id} className="border-t border-gray-100">
                    <td className="sticky left-0 bg-white px-2 py-1.5 text-gray-400">{i + 1}</td>
                    <td className="sticky left-10 bg-white px-2 py-1.5 font-medium">{s.nama}</td>
                    <td className="px-2 py-1.5 text-center text-gray-500">{s.jk}</td>
                    {rekap.data.kolom.map((k, j) => (
                      <td key={k.tanggal} className="px-1 py-1.5 text-center">
                        <Tanda kode={s.status[j] ?? ""} />
                      </td>
                    ))}
                    <td className="px-2 py-1.5 text-center font-semibold text-green-700">{s.hadir || "–"}</td>
                    <td className="px-2 py-1.5 text-center font-semibold text-amber-600">{s.sakit || "–"}</td>
                    <td className="px-2 py-1.5 text-center font-semibold text-sky-600">{s.izin || "–"}</td>
                    <td className="px-2 py-1.5 text-center font-semibold text-red-600">{s.alpa || "–"}</td>
                  </tr>
                ))}

                {rekap.data.siswa.length === 0 && (
                  <tr>
                    <td colSpan={8 + rekap.data.kolom.length} className="px-3 py-8 text-center text-gray-500">
                      Kelas ini belum punya siswa aktif.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-gray-500">
            <span className="text-green-700">●</span> hadir · S sakit · I izin · A alpa · kosong = absensi harian belum diisi.
            Kolom H, S, I, A di kanan hanya ada di tampilan web.
          </p>
        </>
      )}
    </div>
  );
}