"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
  JadwalIndukHari,
  JadwalMingguGuru,
  JadwalMingguKelas,
  JamSekolah,
  PilihanJadwalSekolah,
  PiketSekolah,
  SesiSekolah,
} from "@/lib/types";

type Tab = "induk" | "kelas" | "guru";

const TAB: { kunci: Tab; label: string }[] = [
  { kunci: "induk", label: "Jadwal induk" },
  { kunci: "kelas", label: "Per kelas" },
  { kunci: "guru", label: "Per guru" },
];

// Warna sel mengikuti nama mapel supaya mapel yang sama mudah dikenali
const PALET = [
  "bg-orange-100 text-orange-900",
  "bg-green-100 text-green-900",
  "bg-blue-100 text-blue-900",
  "bg-amber-100 text-amber-900",
  "bg-rose-100 text-rose-900",
  "bg-teal-100 text-teal-900",
  "bg-violet-100 text-violet-900",
  "bg-lime-100 text-lime-900",
];

function warnaMapel(mapel: string | null): string {
  if (!mapel) return "bg-gray-100 text-gray-700";
  let h = 0;
  for (const c of mapel) h = (h * 31 + c.charCodeAt(0)) % 997;
  return PALET[h % PALET.length];
}

const kolom =
  "rounded-2xl border border-gray-300 bg-white/80 px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-orange-500 md:text-sm";

export default function JadwalSekolahHalaman() {
  const [tab, setTab] = useState<Tab>("induk");
  const [hariDipilih, setHariDipilih] = useState<number | null>(null);
  const [kelasId, setKelasId] = useState<number | null>(null);
  const [guruId, setGuruId] = useState<number | null>(null);

  const pilihan = useQuery({
    queryKey: ["pimpinan-jadwal-pilihan"],
    queryFn: () => api<PilihanJadwalSekolah>("pimpinan/jadwal/pilihan"),
    staleTime: 5 * 60_000,
  });

  const p = pilihan.data;

  function bukaKelas(id: number) {
    setKelasId(id);
    setTab("kelas");
  }

  function bukaGuru(id: number) {
    setGuruId(id);
    setTab("guru");
  }

  return (
    <div className="space-y-5">
      <div>
        <Link href="/pimpinan" className="text-sm text-orange-600">← Kembali</Link>
        <h1 className="mt-1 text-2xl font-bold">Jadwal sekolah</h1>
        <p className="text-sm text-gray-500">Jadwal semua kelas dan guru pada tahun ajaran aktif.</p>
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-2xl bg-gray-100 p-1 text-sm font-semibold md:inline-grid">
        {TAB.map((t) => (
          <button
            key={t.kunci}
            onClick={() => setTab(t.kunci)}
            className={`rounded-xl px-5 py-1.5 ${tab === t.kunci ? "bg-white text-orange-600 shadow-sm" : "text-gray-500"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {pilihan.isPending && <div className="h-48 animate-pulse rounded-3xl bg-gray-100" />}

      {pilihan.isError && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-5">
          <p className="font-medium text-red-700">{pilihan.error.message}</p>
        </div>
      )}

      {p && tab === "induk" && (
        <JadwalInduk pilihan={p} hari={hariDipilih ?? p.hari_ini} setHari={setHariDipilih} bukaKelas={bukaKelas} bukaGuru={bukaGuru} />
      )}

      {p && tab === "kelas" && <PerKelas pilihan={p} id={kelasId} setId={setKelasId} bukaGuru={bukaGuru} />}

      {p && tab === "guru" && <PerGuru pilihan={p} id={guruId} setId={setGuruId} bukaKelas={bukaKelas} />}
    </div>
  );
}

// ---------- Jadwal induk: semua kelas pada satu hari ----------

function JadwalInduk({
  pilihan,
  hari,
  setHari,
  bukaKelas,
  bukaGuru,
}: {
  pilihan: PilihanJadwalSekolah;
  hari: number;
  setHari: (h: number) => void;
  bukaKelas: (id: number) => void;
  bukaGuru: (id: number) => void;
}) {
  const [kata, setKata] = useState("");

  const q = useQuery({
    queryKey: ["pimpinan-jadwal-hari", hari],
    queryFn: () => api<JadwalIndukHari>(`pimpinan/jadwal/hari/${hari}`),
    placeholderData: (sebelumnya) => sebelumnya,
    // Penanda "sedang berlangsung" ikut bergeser selama halaman dibuka
    refetchInterval: (query) => (query.state.data?.hari_ini ? 60_000 : false),
  });

  const d = q.data;
  const cari = kata.trim().toLowerCase();
  const kelas = (d?.kelas ?? []).filter(
    (k) => !cari || k.nama.toLowerCase().includes(cari) || k.jurusan.toLowerCase().includes(cari),
  );

  return (
    <div className="space-y-4">
      <section className="space-y-3 rounded-3xl border border-white/80 bg-white/70 p-5 backdrop-blur">
        <div className="flex flex-wrap gap-2 text-sm font-semibold">
          {pilihan.hari.map((h) => (
            <button
              key={h.hari}
              onClick={() => setHari(h.hari)}
              className={`rounded-xl border px-4 py-2 ${
                h.hari === hari ? "border-orange-500 bg-orange-500 text-white" : "border-orange-300 text-orange-700 hover:bg-orange-50"
              }`}
            >
              {h.label}
              {h.hari === pilihan.hari_ini && <span className="ml-1 text-[11px] font-normal opacity-80">(hari ini)</span>}
            </button>
          ))}
        </div>

        {d?.libur && (
          <p className="text-sm font-semibold text-amber-700">Hari ini libur: {d.libur}. Tidak ada kegiatan belajar.</p>
        )}
        {d?.jam_sekarang && !d.libur && (
          <p className="text-xs text-gray-500">Sel hijau bergaris adalah sesi yang sedang berlangsung (pukul {d.jam_sekarang}).</p>
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
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Ringkas nilai={d.ringkasan.kelas} label="Kelas belajar" kelas="bg-orange-50" teks="text-orange-700" />
            <Ringkas nilai={d.ringkasan.guru} label="Guru mengajar" kelas="bg-green-50" teks="text-green-700" />
            <Ringkas nilai={d.ringkasan.sesi} label="Sesi" kelas="bg-orange-50" teks="text-orange-700" />
            <Ringkas nilai={d.ringkasan.jam} label="Jam pelajaran" kelas="bg-green-50" teks="text-green-700" />
          </div>

          <input
            value={kata}
            onChange={(e) => setKata(e.target.value)}
            placeholder="Cari kelas atau jurusan…"
            className={`w-full md:max-w-sm ${kolom}`}
          />

          {d.kelas.length === 0 ? (
            <p className="rounded-3xl border border-white/80 bg-white/70 p-5 text-gray-500">Belum ada jadwal pada hari {d.label}.</p>
          ) : (
            <Matriks
              jam={d.jam}
              kepalaBaris="Kelas"
              baris={kelas.map((k) => ({
                kunci: k.id,
                kepala: (
                  <button onClick={() => bukaKelas(k.id)} className="text-left hover:text-orange-700">
                    <span className="block font-semibold">{k.nama}</span>
                    <span className="block text-[11px] font-normal text-gray-500">{k.jurusan}</span>
                  </button>
                ),
                sel: k.sesi.map((s) => buatSel(s, [s.mapel ?? "-", <GuruLink key="g" s={s} buka={bukaGuru} />, s.ruang])),
              }))}
            />
          )}

          <Piket piket={d.piket} judul={`Guru piket hari ${d.label}`} tampilkanGuru />
        </>
      )}
    </div>
  );
}

// ---------- Per kelas ----------

function PerKelas({
  pilihan,
  id,
  setId,
  bukaGuru,
}: {
  pilihan: PilihanJadwalSekolah;
  id: number | null;
  setId: (id: number | null) => void;
  bukaGuru: (id: number) => void;
}) {
  const q = useQuery({
    queryKey: ["pimpinan-jadwal-kelas", id],
    queryFn: () => api<JadwalMingguKelas>(`pimpinan/jadwal/kelas/${id}`),
    enabled: id !== null,
  });

  const jurusan = [...new Set(pilihan.kelas.map((k) => k.jurusan))];
  const d = q.data;

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-600">
        Pilih kelas
        <select
          value={id ?? ""}
          onChange={(e) => setId(e.target.value ? Number(e.target.value) : null)}
          className={`mt-1 block w-full md:max-w-sm ${kolom}`}
        >
          <option value="">Pilih kelas…</option>
          {jurusan.map((j) => (
            <optgroup key={j} label={j}>
              {pilihan.kelas
                .filter((k) => k.jurusan === j)
                .map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </label>

      {id === null && <p className="rounded-3xl border border-white/80 bg-white/70 p-5 text-gray-500">Pilih kelas untuk melihat jadwal mingguannya.</p>}

      {id !== null && q.isPending && <div className="h-48 animate-pulse rounded-3xl bg-gray-100" />}

      {q.isError && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-5">
          <p className="font-medium text-red-700">{q.error.message}</p>
        </div>
      )}

      {d && id !== null && (
        <>
          <div>
            <p className="text-lg font-bold">Kelas {d.kelas.nama}</p>
            <p className="text-sm text-gray-500">
              {d.kelas.jurusan ?? "Tanpa jurusan"} · Wali kelas: {d.kelas.wali_kelas ?? "belum diatur"}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Ringkas nilai={d.ringkasan.sesi} label="Sesi/minggu" kelas="bg-orange-50" teks="text-orange-700" />
            <Ringkas nilai={d.ringkasan.jam} label="Jam/minggu" kelas="bg-green-50" teks="text-green-700" />
            <Ringkas nilai={d.ringkasan.mapel} label="Mapel" kelas="bg-orange-50" teks="text-orange-700" />
          </div>

          {d.ringkasan.sesi === 0 ? (
            <p className="rounded-3xl border border-white/80 bg-white/70 p-5 text-gray-500">Kelas ini belum memiliki jadwal.</p>
          ) : (
            <Matriks
              jam={d.jam}
              kepalaBaris="Hari"
              baris={d.hari.map((h) => ({
                kunci: h.hari,
                kepala: (
                  <span>
                    <span className="block font-semibold">{h.label}</span>
                    <span className="block text-[11px] font-normal text-gray-500">{h.jam} jam</span>
                  </span>
                ),
                sel: h.sesi.map((s) => buatSel(s, [s.mapel ?? "-", <GuruLink key="g" s={s} buka={bukaGuru} />, s.ruang])),
              }))}
            />
          )}
        </>
      )}
    </div>
  );
}

// ---------- Per guru ----------

function PerGuru({
  pilihan,
  id,
  setId,
  bukaKelas,
}: {
  pilihan: PilihanJadwalSekolah;
  id: number | null;
  setId: (id: number | null) => void;
  bukaKelas: (id: number) => void;
}) {
  const q = useQuery({
    queryKey: ["pimpinan-jadwal-guru", id],
    queryFn: () => api<JadwalMingguGuru>(`pimpinan/jadwal/guru/${id}`),
    enabled: id !== null,
  });

  const d = q.data;

  // Nama kelas pada sel dihubungkan ke id kelasnya lewat daftar pilihan
  const idKelas = new Map(pilihan.kelas.map((k) => [k.nama, k.id]));

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-600">
        Pilih guru
        <select
          value={id ?? ""}
          onChange={(e) => setId(e.target.value ? Number(e.target.value) : null)}
          className={`mt-1 block w-full md:max-w-sm ${kolom}`}
        >
          <option value="">Pilih guru…</option>
          {pilihan.guru.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nama}
            </option>
          ))}
        </select>
      </label>

      {id === null && <p className="rounded-3xl border border-white/80 bg-white/70 p-5 text-gray-500">Pilih guru untuk melihat jadwal mengajar dan piketnya.</p>}

      {id !== null && q.isPending && <div className="h-48 animate-pulse rounded-3xl bg-gray-100" />}

      {q.isError && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-5">
          <p className="font-medium text-red-700">{q.error.message}</p>
        </div>
      )}

      {d && id !== null && (
        <>
          <div>
            <p className="text-lg font-bold">{d.guru.nama}</p>
            <p className="text-sm text-gray-500">{d.guru.nip ?? "NIP belum diisi"}</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Ringkas nilai={d.ringkasan.sesi} label="Sesi/minggu" kelas="bg-orange-50" teks="text-orange-700" />
            <Ringkas nilai={d.ringkasan.jam} label="Jam/minggu" kelas="bg-green-50" teks="text-green-700" />
            <Ringkas nilai={d.ringkasan.mapel} label="Mapel" kelas="bg-orange-50" teks="text-orange-700" />
          </div>

          {d.ringkasan.sesi === 0 ? (
            <p className="rounded-3xl border border-white/80 bg-white/70 p-5 text-gray-500">Guru ini belum memiliki jadwal mengajar.</p>
          ) : (
            <Matriks
              jam={d.jam}
              kepalaBaris="Hari"
              baris={d.hari.map((h) => ({
                kunci: h.hari,
                kepala: (
                  <span>
                    <span className="block font-semibold">{h.label}</span>
                    <span className="block text-[11px] font-normal text-gray-500">{h.jam} jam</span>
                  </span>
                ),
                sel: h.sesi.map((s) =>
                  buatSel(s, [
                    s.kelas && idKelas.has(s.kelas) ? (
                      <button
                        key="k"
                        onClick={(e) => {
                          e.stopPropagation();
                          bukaKelas(idKelas.get(s.kelas!)!);
                        }}
                        className="font-semibold underline-offset-2 hover:underline"
                      >
                        {s.kelas}
                      </button>
                    ) : (
                      (s.kelas ?? "-")
                    ),
                    s.mapel,
                    s.ruang,
                  ]),
                ),
              }))}
            />
          )}

          <Piket piket={d.piket} judul="Jadwal piket" />
        </>
      )}
    </div>
  );
}

// ---------- Komponen bersama ----------

type SelJadwal = { mulai: number; selesai: number; kunci: number; isi: ReactNode[]; warna: string; aktif: boolean; waktu: string };
type BarisJadwal = { kunci: number; kepala: ReactNode; sel: SelJadwal[] };

function buatSel(s: SesiSekolah, isi: (ReactNode | null)[]): SelJadwal {
  return {
    mulai: s.jam_ke_mulai,
    selesai: s.jam_ke_selesai,
    kunci: s.id,
    isi: isi.filter((x): x is ReactNode => x !== null && x !== ""),
    warna: warnaMapel(s.mapel),
    aktif: s.berlangsung === true,
    waktu: `${s.jam_mulai}-${s.jam_selesai}`,
  };
}

function GuruLink({ s, buka }: { s: SesiSekolah; buka: (id: number) => void }) {
  if (!s.guru) return <span>-</span>;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        buka(s.guru_id);
      }}
      className="text-left underline-offset-2 hover:underline"
    >
      {s.guru}
    </button>
  );
}

// Tabel baris x jam ke-N; sesi yang berlangsung beberapa jam digabung ke satu sel
function Matriks({ jam, baris, kepalaBaris }: { jam: JamSekolah[]; baris: BarisJadwal[]; kepalaBaris: string }) {
  const urutJam = [...jam].sort((a, b) => a.jam_ke - b.jam_ke);

  function isiBaris(sels: SelJadwal[]) {
    const hasil: ReactNode[] = [];
    let lewatSampai = 0;

    for (const j of urutJam) {
      if (j.jam_ke <= lewatSampai) continue;

      const s = sels.find((x) => x.mulai === j.jam_ke);

      if (!s) {
        hasil.push(<td key={`kosong-${j.jam_ke}`} className="border-l border-gray-100 p-1" />);
        continue;
      }

      const rentang = urutJam.filter((x) => x.jam_ke >= s.mulai && x.jam_ke <= s.selesai).length || 1;
      lewatSampai = s.selesai;

      hasil.push(
        <td key={s.kunci} colSpan={rentang} className="border-l border-gray-100 p-1 align-top">
          <div className={`h-full rounded-xl px-2 py-1.5 text-xs leading-snug ${s.warna} ${s.aktif ? "ring-2 ring-green-600" : ""}`}>
            {s.isi.map((x, i) => (
              <span key={i} className={`block ${i === 0 ? "font-bold" : ""}`}>
                {x}
              </span>
            ))}
            <span className="mt-0.5 block text-[10px] opacity-70">
              Jam {s.mulai}
              {s.selesai !== s.mulai ? `-${s.selesai}` : ""} · {s.waktu}
              {s.aktif ? " · berlangsung" : ""}
            </span>
          </div>
        </td>,
      );
    }

    return hasil;
  }

  return (
    <div className="overflow-x-auto rounded-3xl border border-white/80 bg-white/80 backdrop-blur">
      <table className="w-full text-left text-sm" style={{ minWidth: `${8 + urutJam.length * 7.5}rem` }}>
        <thead className="border-b border-gray-200 bg-orange-50/70 text-gray-600">
          <tr>
            <th className="sticky left-0 z-10 w-32 bg-orange-50 px-3 py-2.5 font-semibold">{kepalaBaris}</th>
            {urutJam.map((j) => (
              <th key={j.jam_ke} className="border-l border-gray-100 px-2 py-2 text-center font-semibold">
                <span className="block">{j.jam_ke}</span>
                <span className="block text-[10px] font-normal text-gray-500">{j.jam_mulai}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {baris.map((b) => (
            <tr key={b.kunci} className="border-b border-gray-100 last:border-0">
              <th className="sticky left-0 z-10 bg-white px-3 py-2 align-top text-sm">{b.kepala}</th>
              {isiBaris(b.sel)}
            </tr>
          ))}

          {baris.length === 0 && (
            <tr>
              <td colSpan={urutJam.length + 1} className="px-3 py-8 text-center text-gray-500">
                Tidak ada data yang cocok.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Piket({ piket, judul, tampilkanGuru }: { piket: PiketSekolah[]; judul: string; tampilkanGuru?: boolean }) {
  return (
    <section className="space-y-2 rounded-3xl border border-white/80 bg-white/70 p-5 backdrop-blur">
      <h2 className="font-semibold">{judul}</h2>

      {piket.length === 0 ? (
        <p className="text-sm text-gray-500">Tidak ada jadwal piket.</p>
      ) : (
        <ul className="grid gap-2 md:grid-cols-2">
          {piket.map((p, i) => (
            <li key={`${p.hari}-${p.jam_ke_mulai}-${i}`} className="rounded-2xl bg-green-50/70 px-3 py-2 text-sm">
              <p className="font-semibold">{tampilkanGuru ? (p.guru ?? "-") : p.hari_label}</p>
              <p className="text-xs text-gray-600">
                Jam {p.jam_ke_mulai}
                {p.jam_ke_selesai !== p.jam_ke_mulai ? `-${p.jam_ke_selesai}` : ""} · {p.jam_mulai}-{p.jam_selesai}
                {p.tugas ? ` · ${p.tugas}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
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