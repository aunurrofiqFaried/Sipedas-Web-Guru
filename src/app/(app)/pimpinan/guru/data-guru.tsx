"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import Modal from "@/components/modal";
import { api } from "@/lib/api-client";
import type { BarisGuru, DataGuru, DetailDataGuru } from "@/lib/types";

type Kolom = "nama" | "jam" | "kelas" | "kepatuhan";
type Filter = "semua" | "mengajar" | "wali" | "piket";

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

const FILTER: { kunci: Filter; label: string }[] = [
  { kunci: "semua", label: "Semua" },
  { kunci: "mengajar", label: "Mengajar" },
  { kunci: "wali", label: "Wali kelas" },
  { kunci: "piket", label: "Piket" },
];

export default function DataGuruHalaman() {
  const [kata, setKata] = useState("");
  const [filter, setFilter] = useState<Filter>("semua");
  const [urut, setUrut] = useState<{ kolom: Kolom; arah: "naik" | "turun" }>({ kolom: "nama", arah: "naik" });
  const [detailId, setDetailId] = useState<number | null>(null);

  const q = useQuery({
    queryKey: ["pimpinan-guru"],
    queryFn: () => api<DataGuru>("pimpinan/guru"),
  });

  function ubahUrut(kolom: Kolom) {
    setUrut((u) =>
      u.kolom === kolom
        ? { kolom, arah: u.arah === "naik" ? "turun" : "naik" }
        : // Angka paling berguna dilihat dari yang terbesar dulu; nama dari A ke Z
          { kolom, arah: kolom === "nama" ? "naik" : "turun" },
    );
  }

  const guru = useMemo(() => {
    const cari = kata.trim().toLowerCase();
    const { kolom, arah } = urut;
    const faktor = arah === "naik" ? 1 : -1;

    const nilai = (g: BarisGuru): number => {
      if (kolom === "jam") return g.jam_per_minggu;
      if (kolom === "kelas") return g.jumlah_kelas;
      // Guru tanpa data kepatuhan selalu di dasar daftar
      return g.kepatuhan_persen ?? -1;
    };

    return (q.data?.guru ?? [])
      .filter((g) => {
        if (filter === "mengajar") return g.jam_per_minggu > 0;
        if (filter === "wali") return g.wali_kelas.length > 0;
        if (filter === "piket") return g.piket.length > 0;
        return true;
      })
      .filter(
        (g) =>
          !cari ||
          g.nama.toLowerCase().includes(cari) ||
          (g.nip ?? "").includes(cari) ||
          g.role_label.toLowerCase().includes(cari),
      )
      .sort((a, b) =>
        kolom === "nama" ? faktor * a.nama.localeCompare(b.nama, "id") : faktor * (nilai(a) - nilai(b)) || a.nama.localeCompare(b.nama, "id"),
      );
  }, [q.data, kata, filter, urut]);

  const d = q.data;

  return (
    <div className="space-y-5">
      <div>
        <Link href="/pimpinan" className="text-sm text-orange-600">← Kembali</Link>
        <h1 className="mt-1 text-2xl font-bold">Data guru</h1>
        <p className="text-sm text-gray-500">
          Beban jam mengajar, wali kelas, jadwal piket, dan kepatuhan jurnal bulan ini.
        </p>
      </div>

      {q.isPending && <div className="h-48 animate-pulse rounded-3xl bg-gray-100" />}

      {q.isError && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-5">
          <p className="font-medium text-red-700">{q.error.message}</p>
        </div>
      )}

      {d && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <Ringkas nilai={d.ringkasan.guru} label="Total guru" kelas="bg-orange-50" teks="text-orange-700" />
            <Ringkas nilai={d.ringkasan.mengajar} label="Mengajar" kelas="bg-green-50" teks="text-green-700" />
            <Ringkas nilai={d.ringkasan.wali_kelas} label="Wali kelas" kelas="bg-orange-50" teks="text-orange-700" />
            <Ringkas nilai={d.ringkasan.piket} label="Punya piket" kelas="bg-orange-50" teks="text-orange-700" />
            <Ringkas
              nilai={d.ringkasan.rata_jam === null ? "-" : d.ringkasan.rata_jam}
              label="Rata-rata jam/minggu"
              kelas="bg-green-50"
              teks="text-green-700"
            />
          </div>

          {d.ringkasan.jam_tertinggi && (
            <p className="text-sm text-gray-500">
              Beban tertinggi: <b className="text-gray-700">{d.ringkasan.jam_tertinggi.nama}</b> dengan{" "}
              {d.ringkasan.jam_tertinggi.jam} jam per minggu.
            </p>
          )}

          <section className="space-y-3">
            <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
              <input
                value={kata}
                onChange={(e) => setKata(e.target.value)}
                placeholder="Cari nama, NIP, atau jabatan…"
                className="rounded-2xl border border-gray-300 bg-white/80 px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-orange-500 md:text-sm"
              />
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
            </div>

            <div className="overflow-x-auto rounded-3xl border border-white/80 bg-white/80 backdrop-blur">
              <table className="w-full min-w-[56rem] text-left text-sm">
                <thead className="border-b border-gray-200 bg-orange-50/70 text-gray-600">
                  <tr>
                    <th className="px-3 py-2.5 font-semibold">No</th>
                    <Kepala label="Guru" kolom="nama" urut={urut} pilih={ubahUrut} />
                    <Kepala label="Jam/minggu" kolom="jam" urut={urut} pilih={ubahUrut} tengah />
                    <Kepala label="Kelas diajar" kolom="kelas" urut={urut} pilih={ubahUrut} tengah />
                    <th className="px-3 py-2.5 font-semibold">Wali kelas</th>
                    <th className="px-3 py-2.5 font-semibold">Piket</th>
                    <Kepala label="Kepatuhan bulan ini" kolom="kepatuhan" urut={urut} pilih={ubahUrut} />
                  </tr>
                </thead>
                <tbody>
                  {guru.map((g, i) => (
                    <tr
                      key={g.id}
                      onClick={() => setDetailId(g.id)}
                      className="cursor-pointer border-b border-gray-100 last:border-0 hover:bg-orange-50/50"
                    >
                      <td className="px-3 py-2.5 text-gray-400">{i + 1}</td>
                      <td className="px-3 py-2.5">
                        <p className="font-medium">{g.nama}</p>
                        <p className="text-xs text-gray-500">
                          {g.role_label} · {g.nip ?? "NIP belum diisi"}
                        </p>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`font-bold ${g.jam_per_minggu > 0 ? "" : "text-gray-300"}`}>{g.jam_per_minggu || "–"}</span>
                        {g.jam_per_minggu > 0 && <span className="block text-[11px] text-gray-500">{g.sesi_per_minggu} sesi</span>}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={g.jumlah_kelas > 0 ? "font-semibold" : "text-gray-300"}>{g.jumlah_kelas || "–"}</span>
                        {g.jumlah_mapel > 0 && <span className="block text-[11px] text-gray-500">{g.jumlah_mapel} mapel</span>}
                      </td>
                      <td className="px-3 py-2.5">
                        {g.wali_kelas.length > 0 ? (
                          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
                            {g.wali_kelas.join(", ")}
                          </span>
                        ) : (
                          <span className="text-gray-300">–</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-600">
                        {g.piket.length > 0 ? g.piket.map((p) => p.hari_label).join(", ") : <span className="text-gray-300">–</span>}
                      </td>
                      <td className="px-3 py-2.5">
                        {g.kepatuhan_persen === null ? (
                          <span className="text-gray-300">–</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-20 rounded-full bg-gray-200">
                              <div
                                className={`h-2 rounded-full ${warnaBatang(g.kepatuhan_persen)}`}
                                style={{ width: `${g.kepatuhan_persen}%` }}
                              />
                            </div>
                            <span className={`font-bold ${warnaTeks(g.kepatuhan_persen)}`}>{teksPersen(g.kepatuhan_persen)}</span>
                            {g.kepatuhan_status && (
                              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${lencana[g.kepatuhan_status]}`}>
                                {g.kepatuhan_status}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}

                  {guru.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                        Tidak ada guru yang cocok.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-gray-500">
              {guru.length} dari {d.guru.length} guru. Klik baris untuk melihat jadwal lengkap.
            </p>
          </section>
        </>
      )}

      {detailId !== null && (
        <Modal judul="Detail guru" tutup={() => setDetailId(null)}>
          <DetailGuru id={detailId} />
        </Modal>
      )}
    </div>
  );
}

function Kepala({
  label,
  kolom,
  urut,
  pilih,
  tengah,
}: {
  label: string;
  kolom: Kolom;
  urut: { kolom: Kolom; arah: "naik" | "turun" };
  pilih: (k: Kolom) => void;
  tengah?: boolean;
}) {
  const aktif = urut.kolom === kolom;
  const Ikon = !aktif ? ArrowUpDown : urut.arah === "naik" ? ArrowUp : ArrowDown;

  return (
    <th className={`px-3 py-2.5 font-semibold ${tengah ? "text-center" : ""}`} aria-sort={aktif ? (urut.arah === "naik" ? "ascending" : "descending") : "none"}>
      <button
        onClick={() => pilih(kolom)}
        className={`inline-flex items-center gap-1 hover:text-orange-700 ${aktif ? "text-orange-700" : ""}`}
      >
        {label}
        <Ikon className="size-3.5" />
      </button>
    </th>
  );
}

function DetailGuru({ id }: { id: number }) {
  const q = useQuery({
    queryKey: ["pimpinan-guru", id],
    queryFn: () => api<DetailDataGuru>(`pimpinan/guru/${id}`),
  });

  if (q.isPending) return <div className="h-40 animate-pulse rounded-2xl bg-gray-100" />;
  if (q.isError) return <p className="text-red-600">{q.error.message}</p>;

  const d = q.data;
  const k = d.kepatuhan.ringkasan;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-lg font-bold">{d.guru.nama}</p>
        <p className="text-sm text-gray-500">
          {d.guru.role_label} · {d.guru.nip ?? "NIP belum diisi"}
        </p>
        {d.wali_kelas.length > 0 && (
          <p className="mt-1 text-sm font-semibold text-orange-700">Wali kelas {d.wali_kelas.join(", ")}</p>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        <Mini nilai={d.mengajar.jam_per_minggu} label="Jam/minggu" />
        <Mini nilai={d.mengajar.sesi_per_minggu} label="Sesi" />
        <Mini nilai={d.mengajar.jumlah_kelas} label="Kelas" />
        <Mini nilai={d.mengajar.jumlah_mapel} label="Mapel" />
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-gray-600">Jadwal mengajar</p>

        {d.jadwal_mingguan.length === 0 ? (
          <p className="text-sm text-gray-500">Guru ini belum memiliki jadwal mengajar.</p>
        ) : (
          <div className="space-y-3">
            {d.jadwal_mingguan.map((h) => (
              <div key={h.hari}>
                <p className="mb-1 flex justify-between text-sm font-semibold">
                  <span>{h.label}</span>
                  <span className="font-normal text-gray-500">{h.jam} jam</span>
                </p>
                <ul className="space-y-1.5">
                  {h.sesi.map((s, i) => (
                    <li key={`${h.hari}-${s.jam_ke_mulai}-${i}`} className="rounded-2xl bg-orange-50/60 px-3 py-2 text-sm">
                      <p>
                        <b>{s.kelas ?? "-"}</b> · {s.mapel ?? "-"}
                      </p>
                      <p className="text-xs text-gray-500">
                        Jam ke-{s.jam_ke_mulai}
                        {s.jam_ke_selesai !== s.jam_ke_mulai ? `-${s.jam_ke_selesai}` : ""} · {s.jam_mulai} - {s.jam_selesai}
                        {s.ruang ? ` · ${s.ruang}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-gray-600">Jadwal piket</p>

        {d.piket.length === 0 ? (
          <p className="text-sm text-gray-500">Tidak ada jadwal piket.</p>
        ) : (
          <ul className="space-y-1.5">
            {d.piket.map((p, i) => (
              <li key={`${p.hari}-${p.jam}-${i}`} className="rounded-2xl bg-green-50/70 px-3 py-2 text-sm">
                <p className="font-semibold">{p.hari_label}</p>
                <p className="text-xs text-gray-600">
                  {p.jam}
                  {p.tugas ? ` · ${p.tugas}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-gray-600">Kepatuhan jurnal · {d.kepatuhan.periode.label}</p>

        {k.seharusnya === 0 ? (
          <p className="text-sm text-gray-500">Belum ada sesi yang perlu dijurnal pada periode ini.</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl bg-green-50 py-2.5">
                <p className="text-xl font-bold text-green-700">{k.terisi}</p>
                <p className="text-xs text-gray-600">Terisi</p>
              </div>
              <div className="rounded-2xl bg-red-50 py-2.5">
                <p className="text-xl font-bold text-red-700">{k.terlewat}</p>
                <p className="text-xs text-gray-600">Terlewat</p>
              </div>
              <div className="rounded-2xl bg-orange-50 py-2.5">
                <p className={`text-xl font-bold ${warnaTeks(k.persen)}`}>{teksPersen(k.persen)}</p>
                <p className="text-xs text-gray-600">Kepatuhan</p>
              </div>
            </div>

            {d.kepatuhan.terlewat.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {d.kepatuhan.terlewat.map((s, i) => (
                  <li key={`${s.tanggal}-${s.jam_ke_mulai}-${i}`} className="rounded-2xl border border-red-100 bg-red-50/50 px-3 py-2 text-sm">
                    <p className="font-semibold text-red-700">
                      {s.hari}, {s.tanggal_label}
                    </p>
                    <p className="text-xs text-gray-600">
                      {s.kelas ?? "-"} · {s.mapel ?? "-"} · Jam ke-{s.jam_ke_mulai}
                      {s.jam_ke_selesai !== s.jam_ke_mulai ? `-${s.jam_ke_selesai}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Mini({ nilai, label }: { nilai: number; label: string }) {
  return (
    <div className="rounded-2xl bg-orange-50 py-2.5">
      <p className="text-xl font-bold text-orange-700">{nilai}</p>
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