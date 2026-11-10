"use client";

import Link from "next/link";
import { Fragment, useId } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, BookOpen, School, ShieldAlert, TriangleAlert, Users } from "lucide-react";
import { api } from "@/lib/api-client";
import type { DashboardPimpinanData } from "@/lib/types";

/* ---------- Warna dan alat bantu ---------- */

const NEON = {
  hijau: ["#10b981", "#06b6d4"],
  oranye: ["#f97316", "#f59e0b"],
  merah: ["#ef4444", "#ec4899"],
  biru: ["#0ea5e9", "#6366f1"],
} as const;

type Gradasi = readonly [string, string];

const gradPersen = (p: number | null): Gradasi =>
  p === null ? NEON.biru : p >= 90 ? NEON.hijau : p >= 75 ? NEON.oranye : NEON.merah;

const teksPersen = (p: number | null) => (p === null ? "-" : `${p}%`);

const warnaSel = (p: number | null) =>
  p === null
    ? "rgba(0,0,0,0.06)"
    : p >= 95
      ? "rgba(16,185,129,0.85)"
      : p >= 90
        ? "rgba(16,185,129,0.5)"
        : p >= 80
          ? "rgba(245,158,11,0.7)"
          : p >= 70
            ? "rgba(249,115,22,0.8)"
            : "rgba(239,68,68,0.9)";

const garisPeringatan = {
  danger: "border-red-500",
  warn: "border-amber-500",
  info: "border-sky-500",
  ok: "border-emerald-500",
} as const;

const judulPeringatan = {
  danger: "text-red-700",
  warn: "text-amber-700",
  info: "text-sky-700",
  ok: "text-emerald-700",
} as const;

/* ---------- Komponen visual ---------- */

// Bagian tanpa kotak: hanya judul kecil dan garis tipis
function Bagian({
  judul,
  aksi,
  className = "",
  children,
}: {
  judul: string;
  aksi?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={className}>
      <div className="mb-3 flex items-center justify-between gap-2 border-b border-gray-200 pb-2">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">{judul}</h2>
        {aksi}
      </div>
      {children}
    </section>
  );
}

function Cincin({
  nilai,
  ukuran = 120,
  tebal = 10,
  gradasi,
  children,
}: {
  nilai: number | null;
  ukuran?: number;
  tebal?: number;
  gradasi: Gradasi;
  children?: React.ReactNode;
}) {
  const id = useId().replace(/:/g, "");
  const r = (ukuran - tebal) / 2;
  const keliling = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, nilai ?? 0));

  return (
    <div className="relative shrink-0" style={{ width: ukuran, height: ukuran }}>
      <svg width={ukuran} height={ukuran} className="-rotate-90">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={gradasi[0]} />
            <stop offset="100%" stopColor={gradasi[1]} />
          </linearGradient>
        </defs>
        <circle cx={ukuran / 2} cy={ukuran / 2} r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={tebal} />
        <circle
          cx={ukuran / 2}
          cy={ukuran / 2}
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={tebal}
          strokeLinecap="round"
          strokeDasharray={`${(p / 100) * keliling} ${keliling}`}
          style={{ filter: `drop-shadow(0 0 4px ${gradasi[0]}66)`, transition: "stroke-dasharray 0.8s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

function Area({ data, label, gradasi }: { data: (number | null)[]; label: string[]; gradasi: Gradasi }) {
  const id = useId().replace(/:/g, "");

  if (data.length < 2) {
    return <p className="py-8 text-center text-sm text-gray-400">Data belum cukup untuk membuat grafik tren.</p>;
  }

  const W = 480;
  const H = 150;
  const P = 10;
  const nilai = data.map((v) => v ?? 0);
  const min = Math.max(0, Math.floor((Math.min(...nilai) - 5) / 10) * 10);
  const max = 100;
  const x = (i: number) => P + (i * (W - P * 2)) / (nilai.length - 1);
  const y = (v: number) => H - P - ((v - min) / (max - min)) * (H - P * 2);
  const garis = nilai.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const luas = `${garis} L${x(nilai.length - 1).toFixed(1)},${H - P} L${x(0).toFixed(1)},${H - P} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <defs>
          <linearGradient id={`${id}a`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={gradasi[0]} stopOpacity="0.35" />
            <stop offset="100%" stopColor={gradasi[0]} stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${id}b`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={gradasi[0]} />
            <stop offset="100%" stopColor={gradasi[1]} />
          </linearGradient>
        </defs>

        {[min, Math.round((min + max) / 2), max].map((v) => (
          <g key={v}>
            <line x1={P} x2={W - P} y1={y(v)} y2={y(v)} stroke="rgba(0,0,0,0.08)" strokeDasharray="3 4" />
            <text x={P} y={y(v) - 3} fontSize="9" fill="#9ca3af">
              {v}%
            </text>
          </g>
        ))}

        <path d={luas} fill={`url(#${id}a)`} />
        <path
          d={garis}
          fill="none"
          stroke={`url(#${id}b)`}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {nilai.map((v, i) => (
          <circle
            key={i}
            cx={x(i)}
            cy={y(v)}
            r={i === nilai.length - 1 ? 4.5 : 2.4}
            fill={i === nilai.length - 1 ? "#fff" : gradasi[0]}
            stroke={i === nilai.length - 1 ? gradasi[0] : "none"}
            strokeWidth="2.5"
          >
            <title>
              {label[i]}: {data[i] ?? "-"}%
            </title>
          </circle>
        ))}
      </svg>

      <div className="mt-1 flex justify-between text-[10px] text-gray-400">
        <span>{label[0]}</span>
        <span>{label[Math.floor(label.length / 2)]}</span>
        <span>{label[label.length - 1]}</span>
      </div>
    </div>
  );
}

function Batang({ nilai, maks, gradasi, tinggi = 6 }: { nilai: number; maks: number; gradasi: Gradasi; tinggi?: number }) {
  return (
    <div className="w-full rounded-full bg-gray-200" style={{ height: tinggi }}>
      <div
        className="rounded-full"
        style={{
          height: tinggi,
          width: `${Math.max(2, Math.min(100, (nilai / Math.max(1, maks)) * 100))}%`,
          background: `linear-gradient(90deg, ${gradasi[0]}, ${gradasi[1]})`,
        }}
      />
    </div>
  );
}

function PetaPanas({ peta }: { peta: DashboardPimpinanData["peta_panas"] }) {
  const n = peta.tanggal.length;

  if (n === 0 || peta.kelas.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-400">Belum ada data absensi untuk peta panas.</p>;
  }

  return (
    <div className="max-h-[28rem] overflow-auto pr-1">
      <div
        className="grid items-center gap-1 text-[10px] text-gray-500"
        style={{ gridTemplateColumns: `minmax(5rem,8rem) repeat(${n}, minmax(0,1fr))` }}
      >
        <span className="sticky top-0 z-10 bg-white/90 backdrop-blur" />
        {peta.tanggal.map((t) => (
          <span key={t} className="sticky top-0 z-10 bg-white/90 pb-1 text-center backdrop-blur">
            {t}
          </span>
        ))}

        {peta.kelas.map((k) => (
          <Fragment key={k.id}>
            <span className="truncate text-xs text-gray-700" title={`${k.nama} · ${k.jurusan}`}>
              {k.nama}
            </span>
            {k.nilai.map((v, i) => (
              <span
                key={i}
                title={`${k.nama} · ${peta.tanggal[i]}: ${v === null ? "belum diabsen" : `${v}%`}`}
                className="h-4 rounded-[4px]"
                style={{ background: warnaSel(v) }}
              />
            ))}
          </Fragment>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-gray-500">
        {[
          ["rgba(16,185,129,0.85)", "95% ke atas"],
          ["rgba(16,185,129,0.5)", "90-94%"],
          ["rgba(245,158,11,0.7)", "80-89%"],
          ["rgba(249,115,22,0.8)", "70-79%"],
          ["rgba(239,68,68,0.9)", "di bawah 70%"],
          ["rgba(0,0,0,0.06)", "belum diabsen"],
        ].map(([warna, teks]) => (
          <span key={teks} className="flex items-center gap-1">
            <i className="inline-block size-2.5 rounded-sm" style={{ background: warna }} />
            {teks}
          </span>
        ))}
      </div>
    </div>
  );
}

function Kpi({
  ikon,
  label,
  nilai,
  sub,
  gradasi,
}: {
  ikon: React.ReactNode;
  label: string;
  nilai: React.ReactNode;
  sub?: React.ReactNode;
  gradasi: Gradasi;
}) {
  return (
    <div className="md:px-5 md:first:pl-0">
      <div className="flex items-center gap-2 text-gray-500">
        <span
          className="flex size-6 items-center justify-center rounded-md text-white"
          style={{ background: `linear-gradient(135deg, ${gradasi[0]}, ${gradasi[1]})` }}
        >
          {ikon}
        </span>
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-2 text-3xl font-bold tabular-nums">{nilai}</p>
      {sub && <p className="mt-0.5 text-xs">{sub}</p>}
    </div>
  );
}

/* ---------- Dashboard ---------- */

export default function DashboardPimpinan() {
  const q = useQuery({
    queryKey: ["dashboard-pimpinan"],
    queryFn: () => api<DashboardPimpinanData>("pimpinan/dashboard"),
    refetchInterval: 60_000,
  });

  if (q.isPending) {
    return <div className="h-[32rem] animate-pulse rounded-2xl bg-gray-100" />;
  }

  if (q.isError) {
    return (
      <div className="border-l-4 border-red-500 pl-4">
        <p className="font-medium text-red-700">{q.error.message}</p>
        <button onClick={() => q.refetch()} className="mt-3 rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white">
          Coba lagi
        </button>
      </div>
    );
  }

  const d = q.data;
  const a = d.absensi;
  const pel = d.ringkasan.pelanggaran_bulan;
  const selisihPel = pel.jumlah - pel.jumlah_lalu;
  const jam = new Date(d.diperbarui).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const maksJenis = Math.max(1, ...d.pelanggaran.jenis_teratas.map((j) => j.jumlah));
  const maksMinggu = Math.max(1, ...d.pelanggaran.mingguan.map((m) => m.jumlah));
  const maksJurusanPel = Math.max(1, ...d.jurusan.map((j) => j.pelanggaran_bulan));
  const kep = d.kepatuhan.ringkasan;
  const totalGuru = Math.max(1, kep.baik + kep.cukup + kep.kurang);

  return (
    <div className="space-y-8">
      {/* Kepala */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.3em] text-orange-600">PUSAT KENDALI SEKOLAH</p>
          <h1 className="text-3xl font-bold">Kondisi Sekolah</h1>
          <p className="text-sm text-gray-500">
            {d.hari.label}
            {!d.hari.hari_ini && " · data hari efektif terakhir"}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
          </span>
          <b className="text-emerald-600">LIVE</b> · diperbarui {jam}
        </div>
      </div>

      {d.hari.libur && (
        <p className="border-l-4 border-amber-500 pl-3 text-sm text-amber-800">
          Hari ini libur ({d.hari.libur}). Angka di bawah memakai data hari efektif terakhir.
        </p>
      )}

      {/* Baris 1: kehadiran, tren, peringatan */}
      <div className="grid gap-x-10 gap-y-8 lg:grid-cols-2 xl:grid-cols-12">
        <Bagian judul="Kehadiran siswa" className="xl:col-span-5">
          <div className="flex flex-wrap items-center gap-6">
            <Cincin nilai={a.persen} ukuran={150} tebal={12} gradasi={gradPersen(a.persen)}>
              <span className="text-3xl font-bold tabular-nums">{teksPersen(a.persen)}</span>
              <span className="text-[10px] uppercase tracking-widest text-gray-400">hadir</span>
            </Cincin>

            <div className="min-w-[14rem] flex-1 space-y-4">
              <div className="grid grid-cols-4 divide-x divide-gray-200 text-center">
                {[
                  ["Hadir", a.hadir, "text-emerald-600"],
                  ["Sakit", a.sakit, "text-amber-600"],
                  ["Izin", a.izin, "text-sky-600"],
                  ["Alpa", a.alpa, "text-red-600"],
                ].map(([nama, n, warna]) => (
                  <div key={nama as string} className="px-2">
                    <p className={`text-2xl font-bold tabular-nums ${warna}`}>{n}</p>
                    <p className="text-[11px] text-gray-500">{nama}</p>
                  </div>
                ))}
              </div>

              <div>
                <div className="mb-1 flex justify-between text-[11px] text-gray-500">
                  <span>
                    Kelas diabsen {a.kelas_diabsen}/{a.kelas_total}
                  </span>
                  <span>{a.belum} siswa belum diabsen</span>
                </div>
                <Batang nilai={a.kelas_diabsen} maks={a.kelas_total} gradasi={NEON.hijau} tinggi={8} />
              </div>
            </div>
          </div>
        </Bagian>

        <Bagian judul="Tren kehadiran 14 hari" className="xl:col-span-4" aksi={<Activity className="size-4 text-cyan-500" />}>
          <Area data={d.tren_absensi.map((t) => t.persen)} label={d.tren_absensi.map((t) => t.label)} gradasi={NEON.hijau} />
        </Bagian>

        <Bagian judul="Perlu perhatian" className="lg:col-span-2 xl:col-span-3">
          <ul className="space-y-3">
            {d.peringatan.map((p, i) => {
              const isi = (
                <div className={`border-l-4 pl-3 ${garisPeringatan[p.tingkat]}`}>
                  <p className={`text-sm font-semibold ${judulPeringatan[p.tingkat]}`}>{p.judul}</p>
                  {p.detail && <p className="text-xs text-gray-500">{p.detail}</p>}
                </div>
              );

              return <li key={i}>{p.tautan ? <Link href={p.tautan} className="block hover:opacity-80">{isi}</Link> : isi}</li>;
            })}
          </ul>
        </Bagian>
      </div>

      {/* Baris 2: ringkasan angka */}
      <div className="grid grid-cols-2 gap-y-6 border-y border-gray-200 py-5 md:grid-cols-5 md:divide-x md:divide-gray-200">
        <Kpi ikon={<Users className="size-3.5" />} label="Siswa aktif" nilai={d.ringkasan.siswa} sub={<span className="text-gray-500">{d.ringkasan.kelas} kelas</span>} gradasi={NEON.hijau} />
        <Kpi ikon={<School className="size-3.5" />} label="Guru mengajar" nilai={d.ringkasan.guru_mengajar} sub={<span className="text-gray-500">pada hari data</span>} gradasi={NEON.biru} />
        <Kpi
          ikon={<BookOpen className="size-3.5" />}
          label="Jurnal hari ini"
          nilai={`${d.jurnal_hari.terisi}/${d.jurnal_hari.total}`}
          sub={
            d.jurnal_hari.terlewat > 0 ? (
              <span className="text-red-600">{d.jurnal_hari.terlewat} terlewat</span>
            ) : (
              <span className="text-emerald-600">tidak ada yang terlewat</span>
            )
          }
          gradasi={NEON.oranye}
        />
        <Kpi
          ikon={<TriangleAlert className="size-3.5" />}
          label="Pelanggaran bulan ini"
          nilai={pel.jumlah}
          sub={
            <span className={selisihPel > 0 ? "text-red-600" : "text-emerald-600"}>
              {selisihPel === 0 ? "sama dengan bulan lalu" : `${selisihPel > 0 ? "▲" : "▼"} ${Math.abs(selisihPel)} dari bulan lalu`}
            </span>
          }
          gradasi={NEON.merah}
        />
        <Kpi
          ikon={<ShieldAlert className="size-3.5" />}
          label="SP menunggu"
          nilai={d.ringkasan.sp_menunggu}
          sub={<span className="text-gray-500">{d.ringkasan.mendekati_sp} siswa mendekati SP</span>}
          gradasi={NEON.merah}
        />
      </div>

      {/* Baris 3: sholat dan peta panas */}
      <div className="grid gap-x-10 gap-y-8 xl:grid-cols-12">
        <Bagian judul="Sholat hari ini" className="xl:col-span-3">
          <div className="grid grid-cols-2 gap-3">
            {(["dhuhur", "ashar"] as const).map((w) => {
              const s = d.sholat[w];

              return (
                <div key={w} className="flex flex-col items-center">
                  <Cincin nilai={s.persen} ukuran={104} tebal={9} gradasi={gradPersen(s.persen)}>
                    <span className="text-xl font-bold tabular-nums">{teksPersen(s.persen)}</span>
                  </Cincin>
                  <p className="mt-2 text-sm font-semibold capitalize">{w}</p>
                  <p className="text-[11px] text-gray-500">
                    {s.hadir} hadir · {s.tidak_hadir} tidak
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {s.kelas}/{d.sholat.kelas_total} kelas
                  </p>
                </div>
              );
            })}
          </div>
        </Bagian>

        <Bagian judul="Peta panas kehadiran kelas · 10 hari terakhir" className="xl:col-span-9">
          <PetaPanas peta={d.peta_panas} />
        </Bagian>
      </div>

      {/* Baris 4: kelas dan jurusan */}
      <div className="grid gap-x-10 gap-y-8 lg:grid-cols-3">
        <Bagian judul={`Kelas belum diabsen (${d.kelas_belum.length})`}>
          {d.kelas_belum.length === 0 ? (
            <p className="text-sm text-emerald-600">Semua kelas sudah diabsen.</p>
          ) : (
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {d.kelas_belum.map((k) => (
                <span key={k.id} title={k.jurusan} className="border-b-2 border-red-400 text-sm font-semibold text-red-700">
                  {k.nama}
                </span>
              ))}
            </div>
          )}
        </Bagian>

        <Bagian judul="Kehadiran terendah">
          {d.kelas_terendah.length === 0 ? (
            <p className="text-sm text-gray-400">Belum ada absensi tercatat.</p>
          ) : (
            <ul className="space-y-2.5">
              {d.kelas_terendah.map((k) => (
                <li key={k.id} className="grid grid-cols-[5.5rem_minmax(0,1fr)_3rem] items-center gap-3 text-sm">
                  <span className="truncate" title={k.jurusan}>{k.nama}</span>
                  <Batang nilai={k.persen ?? 0} maks={100} gradasi={gradPersen(k.persen)} />
                  <span className="text-right font-bold tabular-nums">{teksPersen(k.persen)}</span>
                </li>
              ))}
            </ul>
          )}
        </Bagian>

        <Bagian judul="Perbandingan jurusan">
          {d.jurusan.length === 0 ? (
            <p className="text-sm text-gray-400">Belum ada data jurusan.</p>
          ) : (
            <ul className="space-y-4">
              {d.jurusan.map((j) => (
                <li key={j.nama}>
                  <div className="flex items-baseline justify-between">
                    <p className="text-sm font-semibold">{j.nama}</p>
                    <p className="text-[11px] text-gray-400">
                      {j.kelas} kelas · {j.siswa} siswa
                    </p>
                  </div>
                  <div className="mt-1.5 space-y-1.5 text-xs">
                    <div className="grid grid-cols-[6rem_minmax(0,1fr)_2.5rem] items-center gap-2">
                      <span className="text-gray-500">Kehadiran</span>
                      <Batang nilai={j.persen ?? 0} maks={100} gradasi={gradPersen(j.persen)} tinggi={5} />
                      <b className="text-right tabular-nums">{teksPersen(j.persen)}</b>
                    </div>
                    <div className="grid grid-cols-[6rem_minmax(0,1fr)_2.5rem] items-center gap-2">
                      <span className="text-gray-500">Pelanggaran</span>
                      <Batang nilai={j.pelanggaran_bulan} maks={maksJurusanPel} gradasi={NEON.merah} tinggi={5} />
                      <b className="text-right tabular-nums">{j.pelanggaran_bulan}</b>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Bagian>
      </div>

      {/* Baris 5: jurnal */}
      <div className="grid gap-x-10 gap-y-8 lg:grid-cols-3">
        <Bagian
          judul="Kepatuhan jurnal bulan ini"
          aksi={
            <Link href="/pimpinan/jurnal" className="text-[11px] font-semibold text-orange-600 hover:underline">
              Detail →
            </Link>
          }
        >
          <div className="flex items-center gap-5">
            <Cincin nilai={kep.persen} ukuran={110} tebal={10} gradasi={gradPersen(kep.persen)}>
              <span className="text-2xl font-bold tabular-nums">{teksPersen(kep.persen)}</span>
            </Cincin>
            <div className="flex-1 space-y-2 text-xs">
              {(
                [
                  ["Baik", kep.baik, NEON.hijau],
                  ["Cukup", kep.cukup, NEON.oranye],
                  ["Kurang", kep.kurang, NEON.merah],
                ] as const
              ).map(([nama, n, g]) => (
                <div key={nama}>
                  <div className="flex justify-between text-gray-600">
                    <span>{nama}</span>
                    <b>{n} guru</b>
                  </div>
                  <Batang nilai={n} maks={totalGuru} gradasi={g} tinggi={5} />
                </div>
              ))}
            </div>
          </div>
        </Bagian>

        <Bagian judul={`Sesi belum dijurnal hari ini (${d.jurnal_hari.terlewat})`}>
          {d.jurnal_hari.daftar_terlewat.length === 0 ? (
            <p className="text-sm text-emerald-600">Tidak ada sesi selesai yang terlewat.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {d.jurnal_hari.daftar_terlewat.map((s, i) => (
                <li key={i} className="py-2 text-sm">
                  <p className="font-semibold text-red-700">{s.guru}</p>
                  <p className="text-gray-600">
                    {s.kelas ?? "-"} · {s.mapel ?? "-"}
                  </p>
                  <p className="text-xs text-gray-400">
                    Jam ke-{s.jam_ke_mulai}
                    {s.jam_ke_selesai !== s.jam_ke_mulai ? `-${s.jam_ke_selesai}` : ""} · {s.jam_mulai}-{s.jam_selesai}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Bagian>

        <Bagian judul="Guru perlu perhatian">
          {d.kepatuhan.terendah.length === 0 ? (
            <p className="text-sm text-gray-400">Belum ada data kepatuhan bulan ini.</p>
          ) : (
            <ul className="space-y-3">
              {d.kepatuhan.terendah.map((g) => (
                <li key={g.id} className="text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="truncate">{g.nama}</span>
                    <b className="tabular-nums">{teksPersen(g.persen)}</b>
                  </div>
                  <Batang nilai={g.persen ?? 0} maks={100} gradasi={gradPersen(g.persen)} tinggi={5} />
                  <p className="mt-0.5 text-[11px] text-gray-400">
                    {g.terisi}/{g.seharusnya} sesi · {g.terlewat} terlewat
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Bagian>
      </div>

      {/* Baris 6: kesiswaan */}
      <div className="grid gap-x-10 gap-y-8 lg:grid-cols-12">
        <Bagian judul="Pelanggaran 8 minggu" className="lg:col-span-6">
          <div className="flex h-36 items-end gap-2">
            {d.pelanggaran.mingguan.map((m) => (
              <div key={m.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <span className="text-[10px] font-semibold tabular-nums text-gray-600">{m.jumlah}</span>
                <div
                  className="w-full rounded-t-md"
                  style={{
                    height: `${Math.max(4, (m.jumlah / maksMinggu) * 100)}%`,
                    background: `linear-gradient(180deg, ${NEON.merah[0]}, ${NEON.merah[1]}55)`,
                  }}
                />
                <span className="text-[10px] text-gray-400">{m.label}</span>
              </div>
            ))}
          </div>

          {d.pelanggaran.jenis_teratas.length > 0 && (
            <div className="mt-4 space-y-2 border-t border-gray-200 pt-3">
              <p className="text-[11px] uppercase tracking-widest text-gray-400">Jenis terbanyak bulan ini</p>
              {d.pelanggaran.jenis_teratas.map((j) => (
                <div key={j.nama} className="grid grid-cols-[minmax(0,1fr)_8rem_2.5rem] items-center gap-3 text-xs">
                  <span className="truncate" title={j.nama}>{j.nama}</span>
                  <Batang nilai={j.jumlah} maks={maksJenis} gradasi={NEON.oranye} tinggi={5} />
                  <span className="text-right font-bold tabular-nums">{j.jumlah}x</span>
                </div>
              ))}
            </div>
          )}
        </Bagian>

        <Bagian judul="Mendekati SP" className="lg:col-span-3">
          {d.sp.mendekati.length === 0 ? (
            <p className="text-sm text-emerald-600">Tidak ada siswa yang mendekati batas.</p>
          ) : (
            <ul className="divide-y divide-gray-100 text-sm">
              {d.sp.mendekati.map((s, i) => (
                <li key={i} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{s.nama}</span>
                    <span className="text-xs text-gray-400">{s.kelas}</span>
                  </span>
                  <span className="shrink-0 text-right text-amber-700">
                    <b>{s.poin_aktif} poin</b>
                    <span className="block text-[11px] text-gray-500">
                      {s.sisa} lagi → {s.menuju}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Bagian>

        <Bagian judul="Poin tertinggi" className="lg:col-span-3">
          {d.sp.poin_tertinggi.length === 0 ? (
            <p className="text-sm text-gray-400">Belum ada poin aktif.</p>
          ) : (
            <ul className="divide-y divide-gray-100 text-sm">
              {d.sp.poin_tertinggi.map((s, i) => (
                <li key={i} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{s.nama}</span>
                    <span className="text-xs text-gray-400">{s.kelas}</span>
                  </span>
                  <b className="text-lg tabular-nums text-red-600">{s.poin_aktif}</b>
                </li>
              ))}
            </ul>
          )}
        </Bagian>
      </div>

      {d.sp.menunggu.length > 0 && (
        <Bagian judul={`Usulan SP menunggu persetujuan (${d.ringkasan.sp_menunggu})`}>
          <ul className="grid gap-x-10 md:grid-cols-2 xl:grid-cols-3">
            {d.sp.menunggu.map((s, i) => (
              <li key={i} className="border-b border-gray-100 py-2.5 text-sm">
                <p className="font-semibold text-amber-800">
                  {s.siswa} · {s.kelas}
                </p>
                <p className="text-xs text-gray-500">
                  {s.aturan} · {s.poin} poin · diusulkan {s.tanggal}
                </p>
              </li>
            ))}
          </ul>
        </Bagian>
      )}
    </div>
  );
}