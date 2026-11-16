"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Modal from "@/components/modal";
import { api } from "@/lib/api-client";
import { dariIso, keIso } from "@/lib/tanggal";
import type { DetailKehadiranKelas, KehadiranSekolah, KelasKehadiran, SiswaKehadiran } from "@/lib/types";

type Tampilan = "absensi" | "sholat";
type FilterStatus = "semua" | "belum" | "sebagian" | "lengkap";
type Urutan = "nama" | "terendah" | "belum";

const teksPersen = (p: number | null) => (p === null ? "-" : `${p}%`);

const warnaTeks = (p: number | null) =>
  p === null ? "text-gray-400" : p >= 90 ? "text-green-700" : p >= 75 ? "text-amber-600" : "text-red-600";
const warnaBatang = (p: number | null) =>
  p === null ? "bg-gray-300" : p >= 90 ? "bg-green-600" : p >= 75 ? "bg-amber-500" : "bg-red-600";

const lencanaKelas: Record<KelasKehadiran["absensi"]["status"], string> = {
  belum: "bg-red-100 text-red-700",
  sebagian: "bg-amber-100 text-amber-700",
  lengkap: "bg-green-100 text-green-700",
};
const labelKelas: Record<KelasKehadiran["absensi"]["status"], string> = {
  belum: "Belum diabsen",
  sebagian: "Sebagian",
  lengkap: "Lengkap",
};

const warnaStatusSiswa: Record<string, string> = {
  hadir: "bg-green-100 text-green-700",
  sakit: "bg-blue-100 text-blue-700",
  izin: "bg-amber-100 text-amber-700",
  alpa: "bg-red-100 text-red-700",
};

const warnaSholat: Record<string, string> = {
  hadir: "bg-green-100 text-green-700",
  tidak_hadir: "bg-red-100 text-red-700",
  berhalangan: "bg-gray-200 text-gray-600",
};
const labelSholat: Record<string, string> = { hadir: "Hadir", tidak_hadir: "Tidak", berhalangan: "Halangan" };

const TAMPILAN: { kunci: Tampilan; label: string }[] = [
  { kunci: "absensi", label: "Absensi" },
  { kunci: "sholat", label: "Sholat" },
];
const FILTER: { kunci: FilterStatus; label: string }[] = [
  { kunci: "semua", label: "Semua" },
  { kunci: "belum", label: "Belum" },
  { kunci: "sebagian", label: "Sebagian" },
  { kunci: "lengkap", label: "Lengkap" },
];

export default function KehadiranHalaman() {
  // null = biarkan server memilih hari efektif terakhir
  const [tanggal, setTanggal] = useState<string | null>(null);
  const [tampilan, setTampilan] = useState<Tampilan>("absensi");
  const [kata, setKata] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("semua");
  const [urut, setUrut] = useState<Urutan>("nama");
  const [detail, setDetail] = useState<{ id: number; nama: string } | null>(null);

  const q = useQuery({
    queryKey: ["pimpinan-kehadiran", tanggal ?? "otomatis"],
    queryFn: () => api<KehadiranSekolah>(`pimpinan/kehadiran${tanggal ? `?tanggal=${tanggal}` : ""}`),
    placeholderData: (sebelumnya) => sebelumnya,
  });

  const d = q.data;
  const hariIni = keIso(new Date());
  const tanggalAktif = tanggal ?? d?.tanggal ?? hariIni;

  function geser(hari: number) {
    const t = dariIso(tanggalAktif);
    t.setDate(t.getDate() + hari);
    const iso = keIso(t);
    if (iso <= hariIni) setTanggal(iso);
  }

  const kelas = useMemo(() => {
    const cari = kata.trim().toLowerCase();

    const nilaiTerendah = (k: KelasKehadiran) => {
      const p = tampilan === "absensi" ? k.absensi.persen : gabungPersen(k);
      return p ?? 101; // yang belum tercatat di bagian akhir
    };

    return (d?.kelas ?? [])
      .filter((k) => tampilan === "sholat" || filter === "semua" || k.absensi.status === filter)
      .filter(
        (k) =>
          !cari ||
          k.nama.toLowerCase().includes(cari) ||
          k.jurusan.toLowerCase().includes(cari) ||
          (k.wali_kelas ?? "").toLowerCase().includes(cari),
      )
      .sort((a, b) => {
        if (urut === "terendah") return nilaiTerendah(a) - nilaiTerendah(b) || a.nama.localeCompare(b.nama, "id");
        if (urut === "belum") {
          return (
            b.siswa - b.absensi.tercatat - (a.siswa - a.absensi.tercatat) || a.nama.localeCompare(b.nama, "id")
          );
        }
        return a.nama.localeCompare(b.nama, "id", { numeric: true });
      });
  }, [d, kata, filter, urut, tampilan]);

  const kolom =
    "rounded-2xl border border-gray-300 bg-white/80 px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-orange-500 md:text-sm";

  return (
    <div className="space-y-5">
      <div>
        <Link href="/pimpinan" className="text-sm text-orange-600">← Kembali</Link>
        <h1 className="mt-1 text-2xl font-bold">Absensi dan sholat semua kelas</h1>
        <p className="text-sm text-gray-500">Pantau kehadiran siswa dan sholat berjamaah per kelas pada satu hari.</p>
      </div>

      <section className="space-y-3 rounded-3xl border border-white/80 bg-white/70 p-5 backdrop-blur">
        <div className="flex flex-wrap items-end gap-2">
          <label className="block text-sm font-medium text-gray-600">
            Tanggal
            <input
              type="date"
              value={tanggalAktif}
              max={hariIni}
              onChange={(e) => e.target.value && setTanggal(e.target.value)}
              className={`mt-1 block ${kolom}`}
            />
          </label>
          <div className="flex gap-2 text-sm font-semibold">
            <button onClick={() => geser(-1)} className="rounded-xl border border-orange-300 px-4 py-2.5 text-orange-700 hover:bg-orange-50">
              ← Sehari sebelum
            </button>
            <button
              onClick={() => geser(1)}
              disabled={tanggalAktif >= hariIni}
              className="rounded-xl border border-orange-300 px-4 py-2.5 text-orange-700 hover:bg-orange-50 disabled:opacity-40"
            >
              Sehari sesudah →
            </button>
            <button onClick={() => setTanggal(null)} className="rounded-xl bg-orange-500 px-4 py-2.5 text-white hover:bg-orange-600">
              Terbaru
            </button>
          </div>
        </div>

        {d && (
          <p className="text-sm text-gray-600">
            <b>{d.label}</b>
            {d.libur && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Libur: {d.libur}</span>}
            {q.isFetching && <span className="ml-2 text-xs text-gray-400">memuat…</span>}
          </p>
        )}
      </section>

      {q.isPending && <div className="h-48 animate-pulse rounded-3xl bg-gray-100" />}

      {q.isError && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-5">
          <p className="font-medium text-red-700">{q.error.message}</p>
        </div>
      )}

      {d && (
        <>
          <div className="grid grid-cols-1 gap-1 rounded-2xl bg-gray-100 p-1 text-sm font-semibold sm:inline-grid sm:grid-cols-2">
            {TAMPILAN.map((t) => (
              <button
                key={t.kunci}
                onClick={() => setTampilan(t.kunci)}
                className={`rounded-xl px-6 py-1.5 ${tampilan === t.kunci ? "bg-white text-orange-600 shadow-sm" : "text-gray-500"}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tampilan === "absensi" ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
              <Ringkas nilai={d.ringkasan.siswa} label="Siswa" kelas="bg-orange-50" teks="text-orange-700" />
              <Ringkas nilai={d.ringkasan.hadir} label="Hadir" kelas="bg-green-50" teks="text-green-700" />
              <Ringkas nilai={d.ringkasan.sakit + d.ringkasan.izin} label="Sakit dan izin" kelas="bg-amber-50" teks="text-amber-700" />
              <Ringkas nilai={d.ringkasan.alpa} label="Alpa" kelas="bg-red-50" teks="text-red-700" />
              <Ringkas nilai={d.ringkasan.belum} label="Belum diabsen" kelas="bg-gray-100" teks="text-gray-700" />
              <Ringkas nilai={teksPersen(d.ringkasan.persen)} label="Kehadiran" kelas="bg-orange-50" teks={warnaTeks(d.ringkasan.persen)} />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Ringkas nilai={d.sholat.peserta} label="Peserta sholat" kelas="bg-orange-50" teks="text-orange-700" />
              <Ringkas nilai={teksPersen(d.sholat.dhuhur.persen)} label={`Dhuhur · ${d.sholat.dhuhur.kelas} kelas`} kelas="bg-green-50" teks={warnaTeks(d.sholat.dhuhur.persen)} />
              <Ringkas nilai={teksPersen(d.sholat.ashar.persen)} label={`Ashar · ${d.sholat.ashar.kelas} kelas`} kelas="bg-green-50" teks={warnaTeks(d.sholat.ashar.persen)} />
              <Ringkas
                nilai={d.sholat.dhuhur.tidak_hadir + d.sholat.ashar.tidak_hadir}
                label="Tidak hadir (total)"
                kelas="bg-red-50"
                teks="text-red-700"
              />
            </div>
          )}

          <p className="text-sm text-gray-500">
            {tampilan === "absensi" ? (
              <>
                Kelas sudah lengkap: <b className="text-green-700">{d.ringkasan.kelas_lengkap}</b> · sebagian:{" "}
                <b className="text-amber-600">{d.ringkasan.kelas_sebagian}</b> · belum diabsen:{" "}
                <b className="text-red-600">{d.ringkasan.kelas_belum}</b> dari {d.ringkasan.kelas} kelas.
              </>
            ) : (
              <>Persentase sholat tidak menghitung siswa yang berhalangan.</>
            )}
          </p>

          <section className="space-y-3">
            <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto_auto]">
              <input
                value={kata}
                onChange={(e) => setKata(e.target.value)}
                placeholder="Cari kelas, jurusan, atau wali kelas…"
                className={kolom}
              />
              <select value={urut} onChange={(e) => setUrut(e.target.value as Urutan)} className={kolom} aria-label="Urutkan kelas">
                <option value="nama">Urut nama kelas</option>
                <option value="terendah">Kehadiran terendah dulu</option>
                {tampilan === "absensi" && <option value="belum">Paling banyak belum diabsen</option>}
              </select>
              {tampilan === "absensi" && (
                <div className="grid grid-cols-4 gap-1 rounded-2xl bg-gray-100 p-1 text-sm font-semibold">
                  {FILTER.map((f) => (
                    <button
                      key={f.kunci}
                      onClick={() => setFilter(f.kunci)}
                      className={`rounded-xl px-3 py-1.5 ${filter === f.kunci ? "bg-white text-orange-600 shadow-sm" : "text-gray-500"}`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="overflow-x-auto rounded-3xl border border-white/80 bg-white/80 backdrop-blur">
              {tampilan === "absensi" ? (
                <table className="w-full min-w-[56rem] text-left text-sm">
                  <thead className="border-b border-gray-200 bg-orange-50/70 text-gray-600">
                    <tr>
                      <th className="px-3 py-2.5 font-semibold">Kelas</th>
                      <th className="px-3 py-2.5 font-semibold">Wali kelas</th>
                      <th className="px-3 py-2.5 text-center font-semibold">Siswa</th>
                      <th className="px-3 py-2.5 text-center font-semibold">H</th>
                      <th className="px-3 py-2.5 text-center font-semibold">S</th>
                      <th className="px-3 py-2.5 text-center font-semibold">I</th>
                      <th className="px-3 py-2.5 text-center font-semibold">A</th>
                      <th className="px-3 py-2.5 font-semibold">Kehadiran</th>
                      <th className="px-3 py-2.5 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kelas.map((k) => (
                      <tr
                        key={k.id}
                        onClick={() => setDetail({ id: k.id, nama: k.nama })}
                        className="cursor-pointer border-b border-gray-100 last:border-0 hover:bg-orange-50/50"
                      >
                        <td className="px-3 py-2.5">
                          <p className="font-medium">{k.nama}</p>
                          <p className="text-xs text-gray-500">{k.jurusan}</p>
                        </td>
                        <td className="px-3 py-2.5 text-gray-600">{k.wali_kelas ?? <span className="text-gray-300">–</span>}</td>
                        <td className="px-3 py-2.5 text-center">{k.siswa}</td>
                        <td className="px-3 py-2.5 text-center font-semibold text-green-700">{k.absensi.hadir}</td>
                        <td className="px-3 py-2.5 text-center">{k.absensi.sakit || <span className="text-gray-300">–</span>}</td>
                        <td className="px-3 py-2.5 text-center">{k.absensi.izin || <span className="text-gray-300">–</span>}</td>
                        <td className={`px-3 py-2.5 text-center font-semibold ${k.absensi.alpa ? "text-red-600" : "text-gray-300"}`}>
                          {k.absensi.alpa || "–"}
                        </td>
                        <td className="px-3 py-2.5">
                          <Batang persen={k.absensi.persen} />
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${lencanaKelas[k.absensi.status]}`}>
                            {labelKelas[k.absensi.status]}
                          </span>
                          {k.absensi.diabsen_oleh && <p className="mt-0.5 text-[11px] text-gray-500">oleh {k.absensi.diabsen_oleh}</p>}
                        </td>
                      </tr>
                    ))}
                    {kelas.length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-3 py-8 text-center text-gray-500">
                          Tidak ada kelas yang cocok.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : (
                <table className="w-full min-w-[52rem] text-left text-sm">
                  <thead className="border-b border-gray-200 bg-orange-50/70 text-gray-600">
                    <tr>
                      <th className="px-3 py-2.5 font-semibold">Kelas</th>
                      <th className="px-3 py-2.5 font-semibold">Wali kelas</th>
                      <th className="px-3 py-2.5 text-center font-semibold">Peserta</th>
                      <th className="px-3 py-2.5 font-semibold">Dhuhur</th>
                      <th className="px-3 py-2.5 font-semibold">Ashar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kelas.map((k) => (
                      <tr
                        key={k.id}
                        onClick={() => setDetail({ id: k.id, nama: k.nama })}
                        className="cursor-pointer border-b border-gray-100 last:border-0 hover:bg-orange-50/50"
                      >
                        <td className="px-3 py-2.5">
                          <p className="font-medium">{k.nama}</p>
                          <p className="text-xs text-gray-500">{k.jurusan}</p>
                        </td>
                        <td className="px-3 py-2.5 text-gray-600">{k.wali_kelas ?? <span className="text-gray-300">–</span>}</td>
                        <td className="px-3 py-2.5 text-center">{k.sholat.peserta || <span className="text-gray-300">–</span>}</td>
                        <td className="px-3 py-2.5">
                          <SelSholat s={k.sholat.dhuhur} peserta={k.sholat.peserta} />
                        </td>
                        <td className="px-3 py-2.5">
                          <SelSholat s={k.sholat.ashar} peserta={k.sholat.peserta} />
                        </td>
                      </tr>
                    ))}
                    {kelas.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-3 py-8 text-center text-gray-500">
                          Tidak ada kelas yang cocok.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            <p className="text-xs text-gray-500">
              {kelas.length} dari {d.kelas.length} kelas. Klik baris untuk melihat rincian per siswa.
            </p>
          </section>
        </>
      )}

      {detail && (
        <Modal judul={`Kelas ${detail.nama}`} tutup={() => setDetail(null)}>
          <DetailKelas id={detail.id} tanggal={tanggal} />
        </Modal>
      )}
    </div>
  );
}

// Rata-rata gabungan Dhuhur dan Ashar untuk pengurutan kelas
function gabungPersen(k: KelasKehadiran): number | null {
  const hadir = k.sholat.dhuhur.hadir + k.sholat.ashar.hadir;
  const total = hadir + k.sholat.dhuhur.tidak_hadir + k.sholat.ashar.tidak_hadir;
  return total > 0 ? Math.round((hadir / total) * 100) : null;
}

function Batang({ persen }: { persen: number | null }) {
  if (persen === null) return <span className="text-gray-300">–</span>;

  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 rounded-full bg-gray-200">
        <div className={`h-2 rounded-full ${warnaBatang(persen)}`} style={{ width: `${persen}%` }} />
      </div>
      <span className={`font-bold ${warnaTeks(persen)}`}>{persen}%</span>
    </div>
  );
}

function SelSholat({ s, peserta }: { s: KelasKehadiran["sholat"]["dhuhur"]; peserta: number }) {
  if (peserta === 0) return <span className="text-xs text-gray-400">Tidak ada peserta</span>;
  if (s.tercatat === 0) return <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500">Belum dicatat</span>;

  return (
    <div className="space-y-1">
      <Batang persen={s.persen} />
      <p className="text-[11px] text-gray-500">
        {s.hadir} hadir · {s.tidak_hadir} tidak · {s.berhalangan} halangan
      </p>
    </div>
  );
}

function DetailKelas({ id, tanggal }: { id: number; tanggal: string | null }) {
  const [bermasalah, setBermasalah] = useState(false);

  const q = useQuery({
    queryKey: ["pimpinan-kehadiran-kelas", id, tanggal ?? "otomatis"],
    queryFn: () => api<DetailKehadiranKelas>(`pimpinan/kehadiran/${id}${tanggal ? `?tanggal=${tanggal}` : ""}`),
  });

  if (q.isPending) return <div className="h-40 animate-pulse rounded-2xl bg-gray-100" />;
  if (q.isError) return <p className="text-red-600">{q.error.message}</p>;

  const d = q.data;

  const perluPerhatian = (s: SiswaKehadiran) =>
    s.status === null ||
    s.status === "alpa" ||
    s.status === "sakit" ||
    s.status === "izin" ||
    s.dhuhur === "tidak_hadir" ||
    s.ashar === "tidak_hadir";

  const daftar = bermasalah ? d.siswa.filter(perluPerhatian) : d.siswa;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-gray-500">{d.label}</p>
        <p className="text-sm text-gray-600">
          Wali kelas: <b>{d.kelas.wali_kelas ?? "belum diatur"}</b> · {d.kelas.siswa} siswa
        </p>
        {d.libur && <p className="mt-1 text-xs font-semibold text-amber-700">Libur: {d.libur}</p>}
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        <Mini nilai={d.absensi.hadir} label="Hadir" kelas="bg-green-50" teks="text-green-700" />
        <Mini nilai={d.absensi.sakit + d.absensi.izin} label="Sakit/izin" kelas="bg-amber-50" teks="text-amber-700" />
        <Mini nilai={d.absensi.alpa} label="Alpa" kelas="bg-red-50" teks="text-red-700" />
        <Mini nilai={d.absensi.belum} label="Belum" kelas="bg-gray-100" teks="text-gray-700" />
      </div>

      <div className="rounded-2xl bg-orange-50/60 px-3 py-2 text-sm">
        <p className="font-semibold text-gray-700">Sholat ({d.sholat.peserta} peserta)</p>
        <p className="text-xs text-gray-600">
          Dhuhur: {d.sholat.dhuhur.hadir} hadir, {d.sholat.dhuhur.tidak_hadir} tidak, {d.sholat.dhuhur.berhalangan} halangan,{" "}
          {d.sholat.dhuhur.belum} belum dicatat
        </p>
        <p className="text-xs text-gray-600">
          Ashar: {d.sholat.ashar.hadir} hadir, {d.sholat.ashar.tidak_hadir} tidak, {d.sholat.ashar.berhalangan} halangan,{" "}
          {d.sholat.ashar.belum} belum dicatat
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-600">
        <input type="checkbox" checked={bermasalah} onChange={(e) => setBermasalah(e.target.checked)} className="size-4 accent-orange-500" />
        Hanya yang tidak hadir atau belum dicatat
      </label>

      <ul className="space-y-1.5">
        {daftar.map((s) => (
          <li key={s.id} className="rounded-2xl border border-gray-100 bg-white px-3 py-2 text-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium">{s.nama}</p>
                <p className="text-[11px] text-gray-500">{s.nis ?? "NIS belum diisi"}</p>
              </div>
              {s.status ? (
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${warnaStatusSiswa[s.status]}`}>
                  {s.status}
                </span>
              ) : (
                <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500">Belum</span>
              )}
            </div>

            {s.keterangan && <p className="mt-0.5 text-xs text-gray-500">{s.keterangan}</p>}

            {s.ikut_sholat && (
              <p className="mt-1 flex flex-wrap gap-1 text-[11px]">
                {(["dhuhur", "ashar"] as const).map((w) => (
                  <span
                    key={w}
                    className={`rounded-full px-2 py-0.5 font-semibold ${s[w] ? warnaSholat[s[w]!] : "bg-gray-100 text-gray-400"}`}
                  >
                    {w === "dhuhur" ? "Dhuhur" : "Ashar"}: {s[w] ? labelSholat[s[w]!] : "-"}
                  </span>
                ))}
              </p>
            )}
          </li>
        ))}

        {daftar.length === 0 && <li className="py-4 text-center text-sm text-gray-500">Tidak ada siswa yang cocok.</li>}
      </ul>
    </div>
  );
}

function Mini({ nilai, label, kelas, teks }: { nilai: number; label: string; kelas: string; teks: string }) {
  return (
    <div className={`rounded-2xl py-2.5 ${kelas}`}>
      <p className={`text-xl font-bold ${teks}`}>{nilai}</p>
      <p className="text-[11px] text-gray-600">{label}</p>
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