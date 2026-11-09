"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { labelWaktu } from "@/lib/tanggal";
import type { PengumumanResponse } from "@/lib/types";

export default function DaftarPengumuman() {
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["pengumuman"],
    queryFn: () => api<PengumumanResponse>("pengumuman"),
    refetchInterval: 60_000,
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

  const daftar = q.data.data;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Pengumuman</h1>

      {daftar.length === 0 && <p className="text-gray-500">Belum ada pengumuman.</p>}

      <div className="max-w-3xl space-y-3">
        {daftar.map((p) => {
          const penting = p.tingkat === "penting";
          const baru = batasBaru !== null && p.id > batasBaru;

          return (
            <article
              key={p.id}
              className={`rounded-3xl border p-5 backdrop-blur ${
                penting
                  ? `border-red-300 ${baru ? "bg-red-50" : "bg-red-50/40"}`
                  : `border-orange-200 ${baru ? "bg-orange-50" : "bg-white/70"}`
              } ${baru ? "border-2" : ""}`}
            >
              {(penting || baru) && (
                <div className="mb-2 flex gap-2">
                  {penting && (
                    <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-bold text-white">Penting</span>
                  )}
                  {baru && (
                    <span className="rounded-full bg-green-600 px-2.5 py-0.5 text-xs font-bold text-white">Baru</span>
                  )}
                </div>
              )}

              <h2 className="text-lg font-bold">{p.judul}</h2>
              <p className="mt-1.5 whitespace-pre-line text-gray-700">{p.isi}</p>

              <p className="mt-3 text-sm text-gray-500">
                {labelWaktu(p.tanggal)}
                {p.pembuat ? ` · ${p.pembuat}` : ""}
              </p>
            </article>
          );
        })}
      </div>
    </div>
  );
}