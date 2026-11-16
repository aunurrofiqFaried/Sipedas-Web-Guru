"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { labelTanggal, labelWaktu } from "@/lib/tanggal";
import Modal from "@/components/modal";
import FormPengumuman from "./form-pengumuman";
import type { Pengumuman, PengumumanResponse } from "@/lib/types";

type Tab = "aktif" | "semua";

export default function DaftarPengumuman({ bolehKelola }: { bolehKelola: boolean }) {
  const qc = useQueryClient();

  const [tab, setTab] = useState<Tab>("aktif");
  // undefined = formulir tertutup, null = pengumuman baru, objek = sedang diubah
  const [form, setForm] = useState<Pengumuman | null | undefined>(undefined);
  const [akanHapus, setAkanHapus] = useState<Pengumuman | null>(null);

  const q = useQuery({
    queryKey: ["pengumuman"],
    queryFn: () => api<PengumumanResponse>("pengumuman"),
    refetchInterval: 60_000,
  });

  // Daftar lengkap (termasuk nonaktif dan kedaluwarsa) hanya untuk pimpinan
  const semua = useQuery({
    queryKey: ["pengumuman-kelola"],
    queryFn: () => api<{ data: Pengumuman[] }>("pimpinan/pengumuman"),
    enabled: bolehKelola && tab === "semua",
  });

  // Id terakhir yang sudah dibaca SAAT halaman dibuka; yang lebih besar ditandai "Baru"
  const [batasBaru, setBatasBaru] = useState<number | null>(null);

  const { mutate: tandaiDibaca } = useMutation({
    mutationFn: () => api<{ message: string }>("pengumuman/dibaca", { method: "POST" }),
    onSuccess: () => {
      // Hanya mematikan lencana; label "Baru" di halaman ini tetap terlihat
      qc.setQueryData<PengumumanResponse>(["pengumuman"], (lama) => (lama ? { ...lama, belum_dibaca: 0 } : lama));
    },
  });

  const { mutate: hapus, isPending: menghapus } = useMutation({
    mutationFn: (id: number) => api<{ message: string }>(`pimpinan/pengumuman/${id}`, { method: "DELETE" }),
    onSuccess: (r) => {
      toast.success(r.message);
      setAkanHapus(null);
      qc.invalidateQueries({ queryKey: ["pengumuman"] });
      qc.invalidateQueries({ queryKey: ["pengumuman-kelola"] });
    },
    onError: (e) => toast.error("Gagal menghapus pengumuman", { description: e.message }),
  });

  useEffect(() => {
    if (!q.data) return;

    if (batasBaru === null) setBatasBaru(q.data.terakhir_dibaca_id);

    // Pengumuman yang masuk saat halaman terbuka langsung dianggap terbaca
    if (q.data.belum_dibaca > 0) tandaiDibaca();
  }, [q.data, batasBaru, tandaiDibaca]);

  if (q.isPending) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-100" />
        <div className="h-28 animate-pulse rounded-3xl bg-gray-100" />
        <div className="h-28 animate-pulse rounded-3xl bg-gray-100" />
      </div>
    );
  }

  if (q.isError) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6">
        <p className="font-medium text-red-700">{q.error.message}</p>
        <button
          onClick={() => q.refetch()}
          className="mt-3 rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  const lihatSemua = bolehKelola && tab === "semua";
  const daftar = lihatSemua ? (semua.data?.data ?? []) : q.data.data;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Pengumuman</h1>

        {bolehKelola && (
          <button
            onClick={() => setForm(null)}
            className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white"
          >
            <Plus className="size-4" />
            Buat pengumuman
          </button>
        )}
      </div>

      {bolehKelola && (
        <div className="flex gap-2">
          {(
            [
              ["aktif", "Yang tampil"],
              ["semua", "Semua (kelola)"],
            ] as const
          ).map(([kode, label]) => (
            <button
              key={kode}
              onClick={() => setTab(kode)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
                tab === kode ? "bg-orange-600 text-white" : "bg-gray-100 text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {lihatSemua && semua.isPending && <div className="h-28 max-w-3xl animate-pulse rounded-3xl bg-gray-100" />}

      {lihatSemua && semua.isError && (
        <p className="font-medium text-red-700">
          {semua.error.message}{" "}
          <button onClick={() => semua.refetch()} className="underline">
            Coba lagi
          </button>
        </p>
      )}

      {daftar.length === 0 && !(lihatSemua && (semua.isPending || semua.isError)) && (
        <p className="text-gray-500">Belum ada pengumuman.</p>
      )}

      <div className="max-w-3xl space-y-3">
        {daftar.map((p) => {
          const penting = p.tingkat === "penting";
          const baru = !lihatSemua && batasBaru !== null && p.id > batasBaru;
          const redup = p.is_aktif === false || p.kedaluwarsa === true;
          const bisaUbah = bolehKelola && p.dapat_diubah === true;

          return (
            <article
              key={p.id}
              className={`rounded-3xl border p-5 backdrop-blur ${
                penting
                  ? `border-red-300 ${baru ? "bg-red-50" : "bg-red-50/40"}`
                  : `border-orange-200 ${baru ? "bg-orange-50" : "bg-white/70"}`
              } ${baru ? "border-2" : ""} ${redup ? "opacity-60" : ""}`}
            >
              {(penting || baru || redup) && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {penting && (
                    <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-bold text-white">Penting</span>
                  )}
                  {baru && (
                    <span className="rounded-full bg-green-600 px-2.5 py-0.5 text-xs font-bold text-white">Baru</span>
                  )}
                  {p.is_aktif === false && (
                    <span className="rounded-full bg-gray-500 px-2.5 py-0.5 text-xs font-bold text-white">Nonaktif</span>
                  )}
                  {p.kedaluwarsa === true && (
                    <span className="rounded-full bg-gray-500 px-2.5 py-0.5 text-xs font-bold text-white">
                      Kedaluwarsa
                    </span>
                  )}
                </div>
              )}

              <h2 className="text-lg font-bold">{p.judul}</h2>
              <p className="mt-1.5 whitespace-pre-line text-gray-700">{p.isi}</p>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-gray-500">
                  {labelWaktu(p.tanggal)}
                  {p.pembuat ? ` · ${p.pembuat}` : ""}
                  {lihatSemua && p.berlaku_sampai ? ` · berlaku sampai ${labelTanggal(p.berlaku_sampai)}` : ""}
                </p>

                {bisaUbah && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => setForm(p)}
                      className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-black/5"
                    >
                      <Pencil className="size-4" />
                      Ubah
                    </button>
                    <button
                      onClick={() => setAkanHapus(p)}
                      className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="size-4" />
                      Hapus
                    </button>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {form !== undefined && <FormPengumuman awal={form} tutup={() => setForm(undefined)} />}

      {akanHapus && (
        <Modal judul="Hapus pengumuman?" tutup={() => setAkanHapus(null)}>
          <p className="text-gray-700">
            &ldquo;{akanHapus.judul}&rdquo; akan dihapus permanen dan tidak tampil lagi di aplikasi.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={() => setAkanHapus(null)}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600"
            >
              Batal
            </button>
            <button
              onClick={() => hapus(akanHapus.id)}
              disabled={menghapus}
              className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {menghapus ? "Menghapus..." : "Hapus"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}