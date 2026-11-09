"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { api } from "@/lib/api-client";
import { useDebounce } from "@/lib/use-debounce";
import type { SiswaCari } from "@/lib/types";

export default function CariSiswa() {
  const [kata, setKata] = useState("");
  const q = useDebounce(kata.trim(), 400);

  const hasil = useQuery({
    queryKey: ["cari-siswa", q],
    queryFn: () => api<{ data: SiswaCari[] }>(`siswa/cari?q=${encodeURIComponent(q)}`),
    enabled: q.length >= 2,
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Poin pelanggaran</h1>

      <div className="relative max-w-xl">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
        <input
          value={kata}
          onChange={(e) => setKata(e.target.value)}
          placeholder="Cari siswa (nama atau NIS)"
          autoFocus
          className="w-full rounded-2xl border border-gray-300 bg-white/80 py-3 pl-12 pr-4 text-base outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {q.length < 2 && <p className="text-gray-500">Ketik minimal 2 huruf nama atau angka NIS siswa.</p>}

      {q.length >= 2 && hasil.isPending && <div className="h-24 max-w-xl animate-pulse rounded-2xl bg-gray-100" />}

      {hasil.isError && <p className="text-red-600">{hasil.error.message}</p>}

      {hasil.data && hasil.data.data.length === 0 && <p className="text-gray-500">Siswa tidak ditemukan.</p>}

      <div className="grid max-w-3xl gap-2.5 md:grid-cols-2">
        {hasil.data?.data.map((s) => (
          <Link
            key={s.id}
            href={`/poin/${s.id}`}
            className="flex items-center justify-between rounded-2xl border border-white/80 bg-white/70 p-4 backdrop-blur transition-shadow hover:shadow-md"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold">{s.nama}</p>
              <p className="text-xs text-gray-500">NIS {s.nis}</p>
            </div>
            <span className="ml-3 shrink-0 text-sm font-semibold text-orange-600">{s.kelas ?? "-"}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}