"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { JadwalSaya } from "@/lib/types";

const namaHari = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

export default function JadwalMingguan() {
  const saya = useQuery({
    queryKey: ["jadwal-saya"],
    queryFn: () => api<JadwalSaya>("jadwal/saya"),
    staleTime: 5 * 60_000,
  });

  if (saya.isPending) return <div className="h-48 animate-pulse rounded-3xl bg-gray-100" />;
  if (saya.isError) return null; // galatnya sudah ditampilkan oleh kalender di atasnya

  const sesi = saya.data.data;
  const piket = (saya.data.piket ?? []).slice().sort((a, b) => a.hari - b.hari || a.jam_ke_mulai - b.jam_ke_mulai);

  if (sesi.length === 0 && piket.length === 0) {
    return (
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Jadwal mingguan</h2>
        <p className="text-gray-500">Belum ada jadwal mengajar maupun piket untuk Anda di tahun ajaran ini.</p>
      </section>
    );
  }

  const maxJam = Math.max(1, ...sesi.map((s) => s.jam_ke_selesai));
  const perHari = (h: number) => sesi.filter((s) => s.hari === h);

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Jadwal mingguan</h2>

      {sesi.length > 0 && (
        <div className="overflow-x-auto rounded-3xl border border-white/80 bg-white/80 backdrop-blur">
          <table className="w-full min-w-[42rem] border-collapse text-sm">
            <thead className="bg-orange-50/70 text-gray-600">
              <tr>
                <th className="w-16 px-3 py-2.5 text-left font-semibold">Jam</th>
                {namaHari.map((n) => (
                  <th key={n} className="border-l border-gray-100 px-3 py-2.5 text-left font-semibold">
                    {n}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: maxJam }, (_, i) => i + 1).map((jam) => (
                <tr key={jam} className="border-t border-gray-100">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Jam {jam}</th>

                  {namaHari.map((_, idx) => {
                    const hari = idx + 1;
                    const daftar = perHari(hari);

                    // Sel ini sudah tertutup blok dari jam sebelumnya (rowSpan)
                    if (daftar.some((s) => s.jam_ke_mulai < jam && s.jam_ke_selesai >= jam)) return null;

                    const mulai = daftar.find((s) => s.jam_ke_mulai === jam);

                    if (!mulai) return <td key={hari} className="border-l border-gray-100" />;

                    return (
                      <td
                        key={hari}
                        rowSpan={mulai.jam_ke_selesai - mulai.jam_ke_mulai + 1}
                        className="border-l border-gray-100 p-1.5 align-top"
                      >
                        <div className="h-full min-h-12 rounded-xl bg-green-50 p-2">
                          <p className="font-bold text-green-800">{mulai.kelas?.nama ?? "-"}</p>
                          <p className="text-xs text-gray-700">{mulai.mapel?.nama ?? "-"}</p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {mulai.jam_mulai} - {mulai.jam_selesai}
                            {mulai.ruang ? ` · ${mulai.ruang.nama}` : ""}
                          </p>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {piket.length > 0 && (
        <div className="rounded-3xl border border-orange-200 bg-orange-50/60 p-5">
          <p className="font-semibold text-orange-700">Piket mingguan</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {piket.map((p) => (
              <li key={p.id}>
                <span className="font-semibold">{namaHari[p.hari - 1] ?? `Hari ${p.hari}`}</span> · Jam ke-{p.jam_ke_mulai}
                {p.jam_ke_selesai !== p.jam_ke_mulai ? `-${p.jam_ke_selesai}` : ""} ({p.jam_mulai} - {p.jam_selesai})
                {p.tugas ? ` · ${p.tugas}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}