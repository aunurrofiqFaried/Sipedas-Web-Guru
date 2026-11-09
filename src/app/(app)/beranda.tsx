"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BookText, Clock, School, Users } from "lucide-react";
import { api } from "@/lib/api-client";
import type { JadwalHariIni, Statistik } from "@/lib/types";

const namaHari = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

function formatTanggal(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${iso}T00:00:00`));
}

export default function Beranda() {
  const jadwal = useQuery({
    queryKey: ["jadwal-hari-ini"],
    queryFn: () => api<JadwalHariIni>("jadwal/hari-ini"),
  });

  // Statistik dimuat terpisah; kegagalannya tidak boleh mengganggu jadwal
  const statistik = useQuery({
    queryKey: ["statistik-guru"],
    queryFn: () => api<Statistik>("statistik/guru"),
  });

  if (jadwal.isPending) {
    return (
      <div className="space-y-4">
        <div className="h-44 animate-pulse rounded-[1.75rem] bg-orange-100" />
        <div className="h-24 animate-pulse rounded-3xl bg-gray-100" />
        <div className="h-24 animate-pulse rounded-3xl bg-gray-100" />
      </div>
    );
  }

  if (jadwal.isError) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6">
        <p className="font-medium text-red-700">{jadwal.error.message}</p>
        <button
          onClick={() => jadwal.refetch()}
          className="mt-3 rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  const d = jadwal.data;
  const s = statistik.data;
  const terisi = d.data.filter((j) => j.sudah_jurnal).length;

  return (
    <div className="space-y-6">
      {/* Kartu sambutan */}
      <section className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white">
        <div className="absolute -right-10 -top-16 size-56 rounded-full bg-white/15" />
        <div className="absolute -bottom-16 right-24 size-32 rounded-full bg-white/10" />

        <div className="relative">
          <p className="text-sm text-white/90">{formatTanggal(d.tanggal)}</p>
          <h1 className="mt-1 text-2xl font-bold">Halo, selamat bekerja</h1>

          <div className="mt-5 grid max-w-sm grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/20 px-4 py-3">
              <p className="text-2xl font-bold">{d.data.length}</p>
              <p className="text-xs text-white/90">Sesi mengajar</p>
            </div>
            <div className="rounded-2xl bg-white/20 px-4 py-3">
              <p className="text-2xl font-bold">
                {terisi}/{d.data.length}
              </p>
              <p className="text-xs text-white/90">Jurnal terisi</p>
            </div>
          </div>
        </div>
      </section>

      {/* Libur, peringatan, piket */}
      {d.libur && (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-4">
          <p className="font-bold text-red-600">Libur · {d.libur.judul}</p>
          {d.libur.keterangan && <p className="mt-1 text-sm">{d.libur.keterangan}</p>}
        </div>
      )}

      {d.peringatan.map((p) => (
        <div key={p.judul} className="rounded-2xl border border-sky-300 bg-sky-50 p-4">
          <p className="font-bold text-sky-700">Hari ini · {p.judul}</p>
          {p.keterangan && <p className="mt-1 text-sm">{p.keterangan}</p>}
        </div>
      ))}

      {d.piket.length > 0 && (
        <div className="rounded-3xl border border-green-300 bg-green-50 p-5">
          <p className="font-bold text-green-700">Anda piket hari ini</p>
          {d.piket.map((p, i) => (
            <p key={i} className="mt-2 text-sm">
              <span className="font-semibold">
                Jam ke-{p.jam_ke_mulai}
                {p.jam_ke_selesai !== p.jam_ke_mulai ? `-${p.jam_ke_selesai}` : ""} · {p.jam_mulai} - {p.jam_selesai}
              </span>
              {p.tugas ? ` · ${p.tugas}` : ""}
            </p>
          ))}
        </div>
      )}

      {/* Statistik mengajar */}
      {s && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Statistik mengajar</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Ubin ikon={<School className="size-5" />} nilai={s.mengajar.jumlah_kelas} label="Kelas diampu" warna="orange" />
            <Ubin ikon={<BookText className="size-5" />} nilai={s.mengajar.jumlah_mapel} label="Mata pelajaran" warna="green" />
            <Ubin ikon={<Clock className="size-5" />} nilai={s.mengajar.jam_per_minggu} label="Jam per minggu" warna="sky" />
            <Ubin ikon={<Users className="size-5" />} nilai={s.mengajar.jumlah_siswa} label="Siswa diajar" warna="amber" />
          </div>
        </section>
      )}

      {/* Jadwal hari ini */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Jadwal mengajar hari ini</h2>

        {d.data.length === 0 ? (
          <p className="text-gray-500">Tidak ada jadwal mengajar hari ini.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {d.data.map((j) => (
              <article key={j.id} className="rounded-3xl border border-white/80 bg-white/70 p-5 shadow-sm backdrop-blur">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span className="text-orange-600">
                    Jam ke-{j.jam_ke_mulai}
                    {j.jam_ke_selesai !== j.jam_ke_mulai ? `-${j.jam_ke_selesai}` : ""}
                  </span>
                  <span className="text-gray-500">
                    {j.jam_mulai} - {j.jam_selesai}
                  </span>
                </div>

                <h3 className="mt-2 text-xl font-bold">{j.kelas?.nama ?? "-"}</h3>
                <p className="text-gray-600">{j.mapel?.nama ?? "-"}</p>
                {j.ruang && (
                  <p className="mt-1 text-sm">
                    {j.ruang.tipe === "lab" ? "Lab" : "Kelas"}: {j.ruang.nama}
                  </p>
                )}

                <div className="mt-4">
                  {j.sudah_jurnal ? (
                    <span className="text-sm font-semibold text-green-600">✓ Jurnal sudah diisi</span>
                  ) : (
                    <Link
                      href="/jurnal"
                      className="inline-block rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Isi jurnal
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Ringkasan bulan ini */}
      {s && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Bulan ini</h2>

          <div className="rounded-3xl border border-white/80 bg-white/70 p-5 backdrop-blur">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Kepatuhan jurnal</p>
              <p className="text-2xl font-bold text-orange-600">
                {s.jurnal_bulan_ini.persen === null ? "-" : `${s.jurnal_bulan_ini.persen}%`}
              </p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-orange-100">
              <div
                className="h-full rounded-full bg-orange-500"
                style={{ width: `${s.jurnal_bulan_ini.persen ?? 0}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              {s.jurnal_bulan_ini.seharusnya === 0
                ? "Belum ada sesi bulan ini yang perlu dijurnal."
                : `${s.jurnal_bulan_ini.terisi} dari ${s.jurnal_bulan_ini.seharusnya} sesi sudah ada jurnalnya (sampai kemarin)`}
            </p>
          </div>

          {s.kelas_wali.map((k) => (
            <div key={k.id} className="rounded-3xl border border-white/80 bg-white/70 p-5 backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Kelas wali · {k.nama}</p>
                  <p className="text-sm text-gray-500">
                    {k.jumlah_siswa} siswa · absensi tercatat {k.hari_tercatat} hari
                  </p>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {k.kehadiran_persen === null ? "-" : `${k.kehadiran_persen}%`}
                </p>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
                <div className="rounded-xl bg-amber-50 py-2">
                  <p className="font-bold text-amber-600">{k.sakit}</p>
                  <p className="text-xs text-amber-600">Sakit</p>
                </div>
                <div className="rounded-xl bg-sky-50 py-2">
                  <p className="font-bold text-sky-600">{k.izin}</p>
                  <p className="text-xs text-sky-600">Izin</p>
                </div>
                <div className="rounded-xl bg-red-50 py-2">
                  <p className="font-bold text-red-600">{k.alpa}</p>
                  <p className="text-xs text-red-600">Alpa</p>
                </div>
              </div>
            </div>
          ))}

          <div className="grid grid-cols-2 gap-3">
            <Ubin ikon={<span className="text-lg">⚠</span>} nilai={s.pelanggaran_dicatat} label="Pelanggaran dicatat" warna="amber" />
            <Ubin
              ikon={<span className="text-lg">★</span>}
              nilai={s.mengajar.hari_terpadat ? namaHari[s.mengajar.hari_terpadat.hari - 1] : "-"}
              label={s.mengajar.hari_terpadat ? `Hari terpadat · ${s.mengajar.hari_terpadat.jam} jam` : "Hari terpadat"}
              warna="orange"
            />
          </div>
        </section>
      )}
    </div>
  );
}

const warnaUbin = {
  orange: "bg-orange-100 text-orange-600",
  green: "bg-green-100 text-green-600",
  sky: "bg-sky-100 text-sky-600",
  amber: "bg-amber-100 text-amber-600",
} as const;

function Ubin({
  ikon,
  nilai,
  label,
  warna,
}: {
  ikon: React.ReactNode;
  nilai: number | string;
  label: string;
  warna: keyof typeof warnaUbin;
}) {
  return (
    <div className="rounded-3xl border border-white/80 bg-white/70 p-4 backdrop-blur">
      <div className={`flex size-9 items-center justify-center rounded-full ${warnaUbin[warna]}`}>{ikon}</div>
      <p className="mt-3 text-2xl font-bold">{nilai}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}