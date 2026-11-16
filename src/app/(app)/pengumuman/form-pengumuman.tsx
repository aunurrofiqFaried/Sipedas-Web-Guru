"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { keIso } from "@/lib/tanggal";
import Modal from "@/components/modal";
import type { Pengumuman } from "@/lib/types";

// awal = null untuk pengumuman baru, atau pengumuman yang sedang diubah
export default function FormPengumuman({ awal, tutup }: { awal: Pengumuman | null; tutup: () => void }) {
  const qc = useQueryClient();

  const [judul, setJudul] = useState(awal?.judul ?? "");
  const [isi, setIsi] = useState(awal?.isi ?? "");
  const [tingkat, setTingkat] = useState<"biasa" | "penting">(awal?.tingkat ?? "biasa");
  const [berlaku, setBerlaku] = useState(awal?.berlaku_sampai ?? "");
  const [aktif, setAktif] = useState(awal?.is_aktif ?? true);

  const simpan = useMutation({
    mutationFn: () =>
      api<{ message: string }>(awal ? `pimpinan/pengumuman/${awal.id}` : "pimpinan/pengumuman", {
        method: awal ? "PUT" : "POST",
        body: {
          judul: judul.trim(),
          isi: isi.trim(),
          tingkat,
          berlaku_sampai: berlaku || null,
          is_aktif: aktif,
        },
      }),
    onSuccess: (r) => {
      toast.success(r.message);
      qc.invalidateQueries({ queryKey: ["pengumuman"] });
      qc.invalidateQueries({ queryKey: ["pengumuman-kelola"] });
      tutup();
    },
    onError: (e) => toast.error("Gagal menyimpan pengumuman", { description: e.message }),
  });

  const kosong = judul.trim() === "" || isi.trim() === "";

  return (
    <Modal judul={awal ? "Ubah pengumuman" : "Buat pengumuman"} tutup={tutup}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!kosong && !simpan.isPending) simpan.mutate();
        }}
      >
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Judul</span>
          <input
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            maxLength={150}
            placeholder="Contoh: Rapat dewan guru"
            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-orange-500"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Isi pengumuman</span>
          <textarea
            value={isi}
            onChange={(e) => setIsi(e.target.value)}
            maxLength={5000}
            rows={6}
            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-orange-500"
          />
        </label>

        <div>
          <span className="mb-1 block text-sm font-medium text-gray-700">Tingkat</span>
          <div className="flex gap-2">
            {(["biasa", "penting"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTingkat(t)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
                  tingkat === t
                    ? t === "penting"
                      ? "bg-red-600 text-white"
                      : "bg-orange-600 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {t === "penting" ? "Penting" : "Biasa"}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Berlaku sampai (opsional)</span>
          <input
            type="date"
            value={berlaku}
            min={awal ? undefined : keIso(new Date())}
            onChange={(e) => setBerlaku(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-orange-500"
          />
          <span className="mt-1 block text-xs text-gray-500">Kosongkan agar tampil terus selama aktif.</span>
        </label>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={aktif} onChange={(e) => setAktif(e.target.checked)} className="size-4" />
          <span className="text-sm text-gray-700">Tampilkan di aplikasi</span>
        </label>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={tutup} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600">
            Batal
          </button>
          <button
            type="submit"
            disabled={kosong || simpan.isPending}
            className="rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {simpan.isPending ? "Menyimpan..." : awal ? "Simpan" : "Terbitkan"}
          </button>
        </div>
      </form>
    </Modal>
  );
}