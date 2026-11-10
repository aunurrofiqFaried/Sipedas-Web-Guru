"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/api-client";
import type { KelasRekap, RekapAbsensi as TipeRekap, RekapSiswa } from "@/lib/types";

type Kolom = "nama" | "hadir" | "sakit" | "izin" | "alpa" | "persen";
type Baris = RekapSiswa & { persen: number | null };

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

function geser(bulan: string, delta: number) {
  const [y, m] = bulan.split("-").map(Number);
  return ymd(new Date(y, m - 1 + delta, 1));
}

function labelBulan(bulan: string) {
  const [y, m] = bulan.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date(y, m - 1, 1));
}

export default function RekapAbsensi() {
  const sekarang = ymd(new Date());

  const [kelasId, setKelasId] = useState<number | null>(null);
  const [bulan, setBulan] = useState(sekarang);
  const [semuaTahun, setSemuaTahun] = useState(false);
  const [kata, setKata] = useState("");
  const [urut, setUrut] = useState<{ kolom: Kolom; arah: 1 | -1 }>({ kolom: "nama", arah: 1 });

  const daftarKelas = useQuery({
    queryKey: ["rekap-kelas"],
    queryFn: () => api<{ data: KelasRekap[] }>("rekap/kelas"),
  });

  const parameter = semuaTahun ? "semua" : bulan;

  const rekap = useQuery({
    queryKey: ["rekap-absensi", kelasId, parameter],
    queryFn: () => api<TipeRekap>(`rekap/absensi?kelas_id=${kelasId}&bulan=${parameter}`),
    enabled: kelasId !== null,
  });

  const baris = useMemo(() => {
    const data: Baris[] = (rekap.data?.siswa ?? []).map((s) => {
      const total = s.hadir + s.sakit + s.izin + s.alpa;
      return { ...s, persen: total > 0 ? Math.round((s.hadir / total) * 100) : null };
    });

    const cari = kata.trim().toLowerCase();
    const tersaring = cari
      ? data.filter((s) => s.nama.toLowerCase().includes(cari) || s.nis.includes(cari))
      : data;

    return [...tersaring].sort((a, b) => {
      if (urut.kolom === "nama") return a.nama.localeCompare(b.nama, "id") * urut.arah;

      const nilai = (s: Baris) => (urut.kolom === "persen" ? (s.persen ?? -1) : s[urut.kolom]);
      return (nilai(a) - nilai(b)) * urut.arah;
    });
  }, [rekap.data, kata, urut]);

  function ubahUrut(kolom: Kolom) {
    setUrut((u) => (u.kolom === kolom ? { kolom, arah: u.arah === 1 ? -1 : 1 } : { kolom, arah: kolom === "nama" ? 1 : -1 }));
  }

  const bisaMaju = bulan < sekarang;
  const bisaMundur = bulan > geser(sekarang, -12);

  const Kepala = ({ kolom, label, kelas = "" }: { kolom: Kolom; label: string; kelas?: string }) => (
    <th className={`px-3 py-2.5 font-semibold ${kelas}`}>
      <button onClick={() => ubahUrut(kolom)} className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown className={`size-3.5 ${urut.kolom === kolom ? "text-orange-600" : "text-gray-300"}`} />
      </button>
    </th>
  );

  return (
    <div className="space-y-5">
      <div>
        <Link href="/rekap" className="text-sm text-orange-600">← Kembali</Link>
        <h1 className="mt-1 text-2xl font-bold">Rekap kehadiran kelas</h1>
      </div>

      {/* Pilihan kelas dan periode */}
      <div className="grid gap-3 rounded-3xl border border-white/80 bg-white/70 p-4 backdrop-blur md:grid-cols-[1fr_auto_auto] md:items-center">
        <select
          value={kelasId ?? ""}
          onChange={(e) => setKelasId(e.target.value ? Number(e.target.value) : null)}
          className="rounded-2xl border border-gray-300 bg-white px-4 py-3 text-base outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="">
            {daftarKelas.isPending ? "Memuat kelas…" : "Pilih kelas"}
          </option>
          {daftarKelas.data?.data.map((k) => (
            <option key={k.id} value={k.id}>
              {k.nama} ({k.jumlah_siswa} siswa)
            </option>
          ))}
        </select>

        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setBulan(geser(bulan, -1))}
            disabled={semuaTahun || !bisaMundur}
            className="rounded-xl p-2 hover:bg-gray-100 disabled:opacity-30"
            aria-label="Bulan sebelumnya"
          >
            <ChevronLeft className="size-5" />
          </button>
          <span className="min-w-36 text-center font-semibold">
            {semuaTahun ? "Satu tahun ajaran" : labelBulan(bulan)}
          </span>
          <button
            onClick={() => setBulan(geser(bulan, 1))}
            disabled={semuaTahun || !bisaMaju}
            className="rounded-xl p-2 hover:bg-gray-100 disabled:opacity-30"
            aria-label="Bulan berikutnya"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1 text-sm font-semibold">
          <button
            onClick={() => setSemuaTahun(false)}
            className={`rounded-lg px-3 py-1.5 ${!semuaTahun ? "bg-white text-orange-600 shadow-sm" : "text-gray-500"}`}
          >
            Per bulan
          </button>
          <button
            onClick={() => setSemuaTahun(true)}
            className={`rounded-lg px-3 py-1.5 ${semuaTahun ? "bg-white text-orange-600 shadow-sm" : "text-gray-500"}`}
          >
            Tahun ajaran
          </button>
        </div>
      </div>

      {kelasId === null && <p className="text-gray-500">Pilih kelas untuk melihat rekapnya.</p>}

      {rekap.isFetching && kelasId !== null && !rekap.data && (
        <div className="h-48 animate-pulse rounded-3xl bg-gray-100" />
      )}

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
                {rekap.data.kelas.nama} · {rekap.data.periode.label}
              </p>
              <p className="text-sm text-gray-500">Absensi tercatat pada {rekap.data.hari_tercatat} hari</p>
            </div>

            <a
              href={`/api/proxy/rekap/absensi/pdf?kelas_id=${kelasId}&bulan=${parameter}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Unduh PDF
            </a>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Ringkas label="Hadir" nilai={rekap.data.total.hadir} kelas="bg-green-50 text-green-700" />
            <Ringkas label="Sakit" nilai={rekap.data.total.sakit} kelas="bg-amber-50 text-amber-700" />
            <Ringkas label="Izin" nilai={rekap.data.total.izin} kelas="bg-sky-50 text-sky-700" />
            <Ringkas label="Alpa" nilai={rekap.data.total.alpa} kelas="bg-red-50 text-red-700" />
          </div>

          <input
            value={kata}
            onChange={(e) => setKata(e.target.value)}
            placeholder="Cari nama atau NIS…"
            className="w-full rounded-2xl border border-gray-300 bg-white/80 px-4 py-3 text-base outline-none focus:ring-2 focus:ring-orange-500 md:max-w-sm"
          />

          {/* Tabel */}
          <div className="overflow-x-auto rounded-3xl border border-white/80 bg-white/80 backdrop-blur">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead className="border-b border-gray-200 bg-orange-50/70 text-gray-600">
                <tr>
                  <th className="w-10 px-3 py-2.5 font-semibold">No</th>
                  <Kepala kolom="nama" label="Nama siswa" />
                  <Kepala kolom="hadir" label="H" kelas="text-center text-green-700" />
                  <Kepala kolom="sakit" label="S" kelas="text-center text-amber-700" />
                  <Kepala kolom="izin" label="I" kelas="text-center text-sky-700" />
                  <Kepala kolom="alpa" label="A" kelas="text-center text-red-700" />
                  <Kepala kolom="persen" label="%" kelas="text-center" />
                </tr>
              </thead>
              <tbody>
                {baris.map((s, i) => (
                  <tr key={s.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-3 py-2.5 text-gray-400">{i + 1}</td>
                    <td className="px-3 py-2.5">
                      <p className="font-medium">{s.nama}</p>
                      <p className="text-xs text-gray-500">{s.nis}</p>
                    </td>
                    <Angka n={s.hadir} warna="text-green-700" />
                    <Angka n={s.sakit} warna="text-amber-700" />
                    <Angka n={s.izin} warna="text-sky-700" />
                    <Angka n={s.alpa} warna="text-red-700" />
                    <td className="px-3 py-2.5 text-center font-semibold">{s.persen === null ? "–" : `${s.persen}%`}</td>
                  </tr>
                ))}

                {baris.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                      {kata ? "Tidak ada siswa yang cocok." : "Kelas ini belum punya siswa aktif."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-gray-500">
            H hadir · S sakit · I izin · A alpa · % = hadir dibagi hari yang tercatat. Unduhan PDF dan Excel berkop
            sekolah menyusul.
          </p>
        </>
      )}
    </div>
  );
}

function Ringkas({ label, nilai, kelas }: { label: string; nilai: number; kelas: string }) {
  return (
    <div className={`rounded-2xl py-3 text-center ${kelas}`}>
      <p className="text-2xl font-bold">{nilai}</p>
      <p className="text-xs font-medium">{label}</p>
    </div>
  );
}

// Angka nol ditampilkan redup supaya yang bermasalah langsung terlihat
function Angka({ n, warna }: { n: number; warna: string }) {
  return (
    <td className={`px-3 py-2.5 text-center ${n === 0 ? "text-gray-300" : `font-bold ${warna}`}`}>
      {n === 0 ? "–" : n}
    </td>
  );
}