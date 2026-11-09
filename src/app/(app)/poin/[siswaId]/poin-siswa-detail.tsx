"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Modal from "@/components/modal";
import { api } from "@/lib/api-client";
import { keIso, labelTanggalPendek, labelWaktu } from "@/lib/tanggal";
import type {
  CatatanPoin,
  JenisPelanggaran,
  JenisRemisi,
  KontakWali,
  PoinSiswa,
  SpSiswa,
} from "@/lib/types";

const warnaKategori: Record<string, { aktif: string; pasif: string; judul: string }> = {
  ringan: { aktif: "border-green-600 bg-green-50", pasif: "border-gray-200", judul: "text-green-700" },
  sedang: { aktif: "border-amber-600 bg-amber-50", pasif: "border-gray-200", judul: "text-amber-700" },
  berat: { aktif: "border-red-600 bg-red-50", pasif: "border-gray-200", judul: "text-red-700" },
};

const labelStatusSp: Record<string, string> = {
  menunggu: "Menunggu persetujuan",
  disetujui: "Disetujui",
  ditolak: "Ditolak",
};

export default function PoinSiswaDetail({ siswaId, bolehKontak }: { siswaId: number; bolehKontak: boolean }) {
  const [modal, setModal] = useState<null | "pelanggaran" | "remisi">(null);

  const q = useQuery({
    queryKey: ["poin-siswa", siswaId],
    queryFn: () => api<PoinSiswa>(`siswa/${siswaId}/pelanggaran`),
  });

  const kembali = (
    <Link href="/poin" className="text-sm text-orange-600">
      ← Cari siswa lain
    </Link>
  );

  if (q.isPending) {
    return (
      <div className="space-y-4">
        {kembali}
        <div className="h-44 animate-pulse rounded-3xl bg-gray-100" />
        <div className="h-40 animate-pulse rounded-3xl bg-gray-100" />
      </div>
    );
  }

  if (q.isError) {
    return (
      <div className="space-y-4">
        {kembali}
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6">
          <p className="font-medium text-red-700">{q.error.message}</p>
          <button
            onClick={() => q.refetch()}
            className="mt-3 rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Coba lagi
          </button>
        </div>
      </div>
    );
  }

  const d = q.data;

  return (
    <div className="space-y-6">
      <div>
        {kembali}
        <h1 className="mt-1 text-2xl font-bold">{d.siswa.nama}</h1>
        <p className="text-sm text-gray-500">
          NIS {d.siswa.nis} · tahun ajaran {d.tahun_ajaran}
        </p>
      </div>

      {/* Poin aktif */}
      <section className="rounded-3xl border border-white/80 bg-white/70 p-6 backdrop-blur">
        <div className="flex items-end gap-2">
          <span className="text-6xl font-bold text-orange-600">{d.total_poin}</span>
          <span className="pb-2 text-gray-500">poin aktif</span>
        </div>

        {d.total_remisi > 0 && (
          <p className="mt-1 text-sm font-medium text-green-600">
            Pelanggaran {d.total_pelanggaran} − remisi {d.total_remisi}
          </p>
        )}

        {d.sp.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {d.sp.map((sp: SpSiswa) => (
              <span
                key={sp.id}
                className={`rounded-full px-3 py-1 text-sm font-semibold ${
                  sp.status === "ditolak" ? "bg-gray-100 text-gray-500" : "bg-red-100 text-red-700"
                }`}
              >
                {sp.aturan?.nama ?? "SP"} · {labelStatusSp[sp.status]}
              </span>
            ))}
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={() => setModal("pelanggaran")}
            className="rounded-2xl bg-orange-600 px-5 py-2.5 font-semibold text-white"
          >
            Catat pelanggaran
          </button>
          <button
            onClick={() => setModal("remisi")}
            disabled={d.total_poin === 0}
            className="rounded-2xl border border-green-600 px-5 py-2.5 font-semibold text-green-700 disabled:border-gray-300 disabled:text-gray-400"
          >
            Beri remisi
          </button>
        </div>

        {d.total_poin === 0 && <p className="mt-2 text-xs text-gray-500">Remisi tersedia setelah siswa punya poin.</p>}
      </section>

      {bolehKontak && <PanelKontakWali siswaId={siswaId} />}

      <TabelRiwayat judul="Riwayat pelanggaran" data={d.riwayat} tanda="+" warna="text-orange-600" kosong="Belum ada pelanggaran tercatat tahun ini." />

      {d.remisi.length > 0 && (
        <TabelRiwayat judul="Riwayat remisi" data={d.remisi} tanda="−" warna="text-green-600" kosong="" />
      )}

      {modal === "pelanggaran" && (
        <Modal judul="Catat pelanggaran" tutup={() => setModal(null)}>
          <FormPelanggaran siswaId={siswaId} tutup={() => setModal(null)} />
        </Modal>
      )}

      {modal === "remisi" && (
        <Modal judul="Beri remisi poin" tutup={() => setModal(null)}>
          <FormRemisi siswaId={siswaId} poinAktif={d.total_poin} tutup={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}

function TabelRiwayat({
  judul,
  data,
  tanda,
  warna,
  kosong,
}: {
  judul: string;
  data: CatatanPoin[];
  tanda: string;
  warna: string;
  kosong: string;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{judul}</h2>

      <div className="overflow-x-auto rounded-3xl border border-white/80 bg-white/80 backdrop-blur">
        <table className="w-full min-w-[34rem] text-left text-sm">
          <thead className="border-b border-gray-200 bg-orange-50/70 text-gray-600">
            <tr>
              <th className="px-3 py-2.5 font-semibold">Tanggal</th>
              <th className="px-3 py-2.5 font-semibold">Jenis</th>
              <th className="px-3 py-2.5 text-center font-semibold">Poin</th>
              <th className="px-3 py-2.5 font-semibold">Dicatat oleh</th>
              <th className="px-3 py-2.5 font-semibold">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr key={r.id} className="border-b border-gray-100 align-top last:border-0">
                <td className="whitespace-nowrap px-3 py-2.5">{labelTanggalPendek(r.tanggal)}</td>
                <td className="px-3 py-2.5 font-medium">{r.jenis?.nama ?? "-"}</td>
                <td className={`px-3 py-2.5 text-center font-bold ${warna}`}>
                  {tanda}
                  {r.poin}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-gray-500">{r.pencatat?.name ?? "-"}</td>
                <td className="max-w-[14rem] px-3 py-2.5 text-gray-500">{r.keterangan ?? "–"}</td>
              </tr>
            ))}

            {data.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-gray-500">
                  {kosong}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ---------- Catat pelanggaran ---------- */

function FormPelanggaran({ siswaId, tutup }: { siswaId: number; tutup: () => void }) {
  const qc = useQueryClient();

  const jenis = useQuery({
    queryKey: ["jenis-pelanggaran"],
    queryFn: () => api<{ data: JenisPelanggaran[] }>("pelanggaran/jenis"),
    staleTime: 5 * 60_000,
  });

  const [terpilih, setTerpilih] = useState<number | null>(null);
  const [tanggal, setTanggal] = useState(keIso(new Date()));
  const [keterangan, setKeterangan] = useState("");

  const kelompok = useMemo(() => {
    const peta = new Map<string, JenisPelanggaran[]>();

    for (const j of jenis.data?.data ?? []) {
      const kunci = j.kategori ?? "lainnya";
      peta.set(kunci, [...(peta.get(kunci) ?? []), j]);
    }

    return [...peta.entries()];
  }, [jenis.data]);

  const dipilih = jenis.data?.data.find((j) => j.id === terpilih);

  const simpan = useMutation({
    mutationFn: () =>
      api<{
        poin_ditambahkan: number;
        total_poin: number;
        sp_baru: { aturan: { nama: string } | null } | null;
      }>("pelanggaran", {
        method: "POST",
        body: {
          siswa_id: siswaId,
          jenis_pelanggaran_id: terpilih,
          tanggal,
          keterangan: keterangan.trim() || null,
        },
      }),
    onSuccess: (res) => {
      toast.success("Pelanggaran tercatat", { description: `+${res.poin_ditambahkan} poin · total ${res.total_poin}` });

      if (res.sp_baru) {
        toast.warning(`Batas ${res.sp_baru.aturan?.nama ?? "SP"} tercapai`, {
          description: "Usulan SP dikirim ke kesiswaan untuk disetujui.",
          duration: 8000,
        });
      }

      qc.invalidateQueries({ queryKey: ["poin-siswa", siswaId] });
      qc.invalidateQueries({ queryKey: ["statistik-guru"] });
      tutup();
    },
    onError: (e) => toast.error("Gagal mencatat pelanggaran", { description: e.message }),
  });

  if (jenis.isPending) return <div className="h-40 animate-pulse rounded-2xl bg-gray-100" />;
  if (jenis.isError) return <p className="text-red-600">{jenis.error.message}</p>;

  return (
    <div className="space-y-4">
      {kelompok.map(([kategori, daftar]) => {
        const warna = warnaKategori[kategori];

        return (
          <div key={kategori} className="space-y-2">
            <p className={`text-sm font-bold capitalize ${warna?.judul ?? "text-gray-600"}`}>{kategori}</p>
            {daftar.map((j) => (
              <button
                key={j.id}
                type="button"
                onClick={() => setTerpilih(j.id)}
                className={`flex w-full items-center justify-between rounded-2xl border-2 px-4 py-3 text-left ${
                  terpilih === j.id ? (warna?.aktif ?? "border-orange-600 bg-orange-50") : (warna?.pasif ?? "border-gray-200")
                }`}
              >
                <span className="font-medium">{j.nama}</span>
                <span className="ml-3 shrink-0 font-bold text-orange-600">+{j.poin}</span>
              </button>
            ))}
          </div>
        );
      })}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium text-gray-600">
          Tanggal kejadian
          <input
            type="date"
            value={tanggal}
            max={keIso(new Date())}
            onChange={(e) => setTanggal(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-gray-300 bg-white px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-orange-500"
          />
        </label>
      </div>

      <label className="block text-sm font-medium text-gray-600">
        Keterangan (opsional)
        <textarea
          value={keterangan}
          onChange={(e) => setKeterangan(e.target.value.slice(0, 1000))}
          rows={3}
          className="mt-1 w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-base outline-none focus:ring-2 focus:ring-orange-500"
        />
      </label>

      <button
        onClick={() => simpan.mutate()}
        disabled={terpilih === null || !tanggal || simpan.isPending}
        className="w-full rounded-2xl bg-orange-600 py-3 font-semibold text-white disabled:bg-gray-300"
      >
        {simpan.isPending ? "Menyimpan…" : dipilih ? `Catat: ${dipilih.nama} (+${dipilih.poin} poin)` : "Pilih jenis pelanggaran"}
      </button>
    </div>
  );
}

/* ---------- Beri remisi ---------- */

function FormRemisi({ siswaId, poinAktif, tutup }: { siswaId: number; poinAktif: number; tutup: () => void }) {
  const qc = useQueryClient();

  const jenis = useQuery({
    queryKey: ["jenis-remisi"],
    queryFn: () => api<{ data: JenisRemisi[] }>("remisi/jenis"),
    staleTime: 5 * 60_000,
  });

  const [terpilih, setTerpilih] = useState<number | null>(null);
  const [tanggal, setTanggal] = useState(keIso(new Date()));
  const [keterangan, setKeterangan] = useState("");

  const dipilih = jenis.data?.data.find((j) => j.id === terpilih);

  const simpan = useMutation({
    mutationFn: () =>
      api<{ poin_dikurangi: number; total_poin_sekarang: number }>("remisi", {
        method: "POST",
        body: {
          siswa_id: siswaId,
          jenis_remisi_id: terpilih,
          tanggal,
          keterangan: keterangan.trim() || null,
        },
      }),
    onSuccess: (res) => {
      toast.success("Remisi diberikan", {
        description: `−${res.poin_dikurangi} poin · poin aktif sekarang ${res.total_poin_sekarang}`,
      });
      qc.invalidateQueries({ queryKey: ["poin-siswa", siswaId] });
      qc.invalidateQueries({ queryKey: ["statistik-guru"] });
      tutup();
    },
    onError: (e) => toast.error("Gagal memberi remisi", { description: e.message }),
  });

  if (jenis.isPending) return <div className="h-40 animate-pulse rounded-2xl bg-gray-100" />;
  if (jenis.isError) return <p className="text-red-600">{jenis.error.message}</p>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Pilih kegiatan atau ketertiban yang dilakukan siswa. Poin aktif saat ini <b>{poinAktif}</b>; remisi tidak bisa
        melebihinya.
      </p>

      {jenis.data.data.length === 0 && (
        <p className="text-gray-500">Belum ada jenis remisi. Minta admin menambahkannya di panel.</p>
      )}

      <div className="space-y-2">
        {jenis.data.data.map((j) => {
          const terlaluBesar = j.poin > poinAktif;

          return (
            <button
              key={j.id}
              type="button"
              disabled={terlaluBesar}
              onClick={() => setTerpilih(j.id)}
              className={`flex w-full items-center justify-between rounded-2xl border-2 px-4 py-3 text-left disabled:opacity-40 ${
                terpilih === j.id ? "border-green-600 bg-green-50" : "border-gray-200"
              }`}
            >
              <span>
                <span className="block font-medium">{j.nama}</span>
                {j.keterangan && <span className="block text-xs text-gray-500">{j.keterangan}</span>}
                {terlaluBesar && <span className="block text-xs text-red-600">Melebihi poin aktif siswa</span>}
              </span>
              <span className="ml-3 shrink-0 font-bold text-green-600">−{j.poin}</span>
            </button>
          );
        })}
      </div>

      <label className="block text-sm font-medium text-gray-600">
        Tanggal
        <input
          type="date"
          value={tanggal}
          max={keIso(new Date())}
          onChange={(e) => setTanggal(e.target.value)}
          className="mt-1 w-full rounded-2xl border border-gray-300 bg-white px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-green-600 sm:max-w-xs"
        />
      </label>

      <label className="block text-sm font-medium text-gray-600">
        Keterangan (opsional)
        <textarea
          value={keterangan}
          onChange={(e) => setKeterangan(e.target.value.slice(0, 1000))}
          rows={3}
          className="mt-1 w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-base outline-none focus:ring-2 focus:ring-green-600"
        />
      </label>

      <button
        onClick={() => simpan.mutate()}
        disabled={terpilih === null || !tanggal || simpan.isPending}
        className="w-full rounded-2xl bg-green-600 py-3 font-semibold text-white disabled:bg-gray-300"
      >
        {simpan.isPending ? "Menyimpan…" : dipilih ? `Berikan: ${dipilih.nama} (−${dipilih.poin} poin)` : "Pilih kegiatan"}
      </button>
    </div>
  );
}

/* ---------- Hubungi wali (guru BK, waka kesiswaan, admin) ---------- */

const tujuanWali = [
  { kode: "konseling", label: "Konseling" },
  { kode: "pelanggaran", label: "Pelanggaran" },
  { kode: "absensi", label: "Absensi" },
  { kode: "lainnya", label: "Lainnya" },
];

function PanelKontakWali({ siswaId }: { siswaId: number }) {
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["kontak-wali", siswaId],
    queryFn: () => api<KontakWali>(`bk/siswa/${siswaId}/kontak-wali`),
  });

  const [tujuan, setTujuan] = useState("konseling");
  const [catatan, setCatatan] = useState("");

  const catat = useMutation({
    mutationFn: () =>
      api<{ message: string }>(`bk/siswa/${siswaId}/kontak-wali`, {
        method: "POST",
        body: { tujuan, catatan: catatan.trim() || null },
      }),
    onSuccess: () => {
      toast.success("Riwayat kontak tercatat");
      setCatatan("");
      qc.invalidateQueries({ queryKey: ["kontak-wali", siswaId] });
    },
    onError: (e) => toast.error("Riwayat kontak gagal tercatat", { description: e.message }),
  });

  if (q.isPending) return <div className="h-40 animate-pulse rounded-3xl bg-gray-100" />;
  if (q.isError) return <p className="text-red-600">{q.error.message}</p>;

  const d = q.data;

  return (
    <section className="space-y-4 rounded-3xl border border-white/80 bg-white/70 p-6 backdrop-blur">
      <h2 className="text-lg font-semibold">Hubungi orang tua / wali</h2>

      <div>
        <p className="font-semibold">
          {d.wali.nama ?? "Nama wali belum diisi"}
          {d.wali.hubungan ? ` (${d.wali.hubungan})` : ""}
        </p>
        <p className="text-gray-600">{d.wali.no_hp ?? "Nomor belum diisi"}</p>
        {!d.ada_nomor_wali && (
          <p className="mt-1 text-sm text-red-600">
            Nomor wali belum valid atau belum diisi. Minta admin melengkapinya di data siswa.
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {tujuanWali.map((t) => (
          <button
            key={t.kode}
            onClick={() => setTujuan(t.kode)}
            className={`rounded-xl border px-4 py-2 text-sm font-semibold ${
              tujuan === t.kode ? "border-orange-600 bg-orange-600 text-white" : "border-orange-300 text-orange-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <textarea
        value={catatan}
        onChange={(e) => setCatatan(e.target.value.slice(0, 1000))}
        rows={2}
        placeholder="Catatan: hal yang akan dibicarakan dengan wali (opsional)"
        className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-base outline-none focus:ring-2 focus:ring-orange-500"
      />

      {/* Riwayat dicatat saat tombol ditekan; WhatsApp dibuka lewat tautan biasa supaya tidak diblokir browser */}
      {d.wa_link ? (
        <a
          href={d.wa_link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => catat.mutate()}
          className="inline-block rounded-2xl bg-green-600 px-6 py-3 font-semibold text-white"
        >
          Hubungi via WhatsApp
        </a>
      ) : (
        <span className="inline-block rounded-2xl bg-gray-200 px-6 py-3 font-semibold text-gray-400">
          Hubungi via WhatsApp
        </span>
      )}

      <div>
        <p className="mb-2 text-sm font-semibold text-gray-600">Riwayat kontak</p>

        {d.riwayat.length === 0 ? (
          <p className="text-sm text-gray-500">Belum pernah dihubungi lewat aplikasi.</p>
        ) : (
          <ul className="space-y-2">
            {d.riwayat.map((r) => (
              <li key={r.id} className="rounded-2xl border border-gray-100 bg-white/80 p-3 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="font-semibold capitalize text-orange-600">{r.tujuan}</span>
                  <span className="text-gray-500">{labelWaktu(r.waktu)}</span>
                </div>
                <p className="text-gray-500">oleh {r.oleh ?? "-"}</p>
                {r.catatan && <p className="mt-1">{r.catatan}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}