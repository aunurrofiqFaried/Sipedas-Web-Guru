"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import type { Jadwal, JadwalHariIni, JurnalBulan, JurnalItem } from "@/lib/types";

const BATAS = 2000;

export default function JurnalHariIni() {
  const jadwal = useQuery({
    queryKey: ["jadwal-hari-ini"],
    queryFn: () => api<JadwalHariIni>("jadwal/hari-ini"),
  });

  const tanggal = jadwal.data?.tanggal;

  // Jurnal bulan ini: dipakai untuk mengisi formulir saat jurnal hari ini ingin diubah
  const jurnal = useQuery({
    queryKey: ["jurnal-bulan", tanggal?.slice(0, 7)],
    queryFn: () => api<JurnalBulan>(`jurnal/bulan?bulan=${tanggal!.slice(0, 7)}`),
    enabled: !!tanggal,
  });

  if (jadwal.isPending) return <div className="h-40 animate-pulse rounded-3xl bg-gray-100" />;

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

  return (
    <div className="space-y-4">
      {d.libur && (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-4">
          <p className="font-bold text-red-600">Libur · {d.libur.judul}</p>
          <p className="mt-1 text-sm">Jurnal tidak bisa diisi pada hari libur.</p>
        </div>
      )}

      {d.data.length === 0 && !d.libur && <p className="text-gray-500">Tidak ada jadwal mengajar hari ini.</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {d.data.map((j) => (
          <KartuSesi
            key={j.id}
            j={j}
            tanggal={d.tanggal}
            sudahDimuat={!!jurnal.data}
            jurnalAda={jurnal.data?.data.find((x) => x.jadwal_id === j.id && x.tanggal === d.tanggal)}
          />
        ))}
      </div>
    </div>
  );
}

function KartuSesi({
  j,
  sudahDimuat,
  jurnalAda,
}: {
  j: Jadwal;
  tanggal: string;
  sudahDimuat: boolean;
  jurnalAda?: JurnalItem;
}) {
  const [buka, setBuka] = useState(false);

  return (
    <article className="rounded-3xl border border-white/80 bg-white/70 p-5 shadow-sm backdrop-blur">
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

      {jurnalAda && !buka && (
        <div className="mt-3 rounded-2xl bg-green-50 p-3 text-sm">
          <p className="font-semibold text-green-700">✓ Jurnal sudah diisi</p>
          <p className="mt-1 whitespace-pre-line text-gray-700">{jurnalAda.materi}</p>
          {jurnalAda.catatan && <p className="mt-1 text-gray-500">Catatan: {jurnalAda.catatan}</p>}
        </div>
      )}

      {!buka && (
        <button
          onClick={() => setBuka(true)}
          disabled={j.sudah_jurnal && !sudahDimuat}
          className={`mt-4 rounded-xl px-4 py-2 text-sm font-semibold ${
            j.sudah_jurnal ? "border border-orange-600 text-orange-600" : "bg-orange-600 text-white"
          } disabled:opacity-50`}
        >
          {j.sudah_jurnal ? "Ubah jurnal" : "Isi jurnal"}
        </button>
      )}

      {buka && <FormJurnal j={j} awal={jurnalAda} tutup={() => setBuka(false)} />}
    </article>
  );
}

function FormJurnal({ j, awal, tutup }: { j: Jadwal; awal?: JurnalItem; tutup: () => void }) {
  const qc = useQueryClient();
  const [materi, setMateri] = useState(awal?.materi ?? "");
  const [catatan, setCatatan] = useState(awal?.catatan ?? "");

  const simpan = useMutation({
    mutationFn: () =>
      api<{ message: string }>("jurnal", {
        method: "POST",
        body: { jadwal_id: j.id, materi: materi.trim(), catatan: catatan.trim() || null },
      }),
    onSuccess: () => {
      toast.success("Jurnal tersimpan", { description: `${j.kelas?.nama ?? ""} · ${j.mapel?.nama ?? ""}` });
      qc.invalidateQueries({ queryKey: ["jadwal-hari-ini"] });
      qc.invalidateQueries({ queryKey: ["jurnal-bulan"] });
      qc.invalidateQueries({ queryKey: ["statistik-guru"] });
      tutup();
    },
    onError: (e) => toast.error("Gagal menyimpan jurnal", { description: e.message }),
  });

  const sah = materi.trim().length >= 5;

  return (
    <div className="mt-4 space-y-3">
      <div>
        <label className="text-sm font-medium text-gray-600">Materi pembelajaran *</label>
        <textarea
          value={materi}
          onChange={(e) => setMateri(e.target.value.slice(0, BATAS))}
          rows={4}
          autoFocus
          placeholder="Contoh: Pengenalan HTML dan CSS"
          className="mt-1 w-full rounded-2xl border border-gray-300 bg-white/80 px-4 py-3 text-base outline-none focus:ring-2 focus:ring-orange-500"
        />
        <p className="text-right text-xs text-gray-400">
          {materi.length}/{BATAS}
        </p>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-600">Catatan (opsional)</label>
        <textarea
          value={catatan}
          onChange={(e) => setCatatan(e.target.value.slice(0, BATAS))}
          rows={2}
          className="mt-1 w-full rounded-2xl border border-gray-300 bg-white/80 px-4 py-3 text-base outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => simpan.mutate()}
          disabled={!sah || simpan.isPending}
          className="flex-1 rounded-xl bg-orange-600 py-2.5 text-sm font-semibold text-white disabled:bg-gray-300"
        >
          {simpan.isPending ? "Menyimpan…" : "Simpan jurnal"}
        </button>
        <button onClick={tutup} className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600">
          Batal
        </button>
      </div>

      {!sah && materi.length > 0 && <p className="text-xs text-gray-500">Materi minimal 5 karakter.</p>}
    </div>
  );
}