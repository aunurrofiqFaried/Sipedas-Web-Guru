"use client";

import { FormEvent, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

export default function FormPassword() {
  const [lama, setLama] = useState("");
  const [baru, setBaru] = useState("");
  const [konfirmasi, setKonfirmasi] = useState("");
  const [tampil, setTampil] = useState(false);
  const [galat, setGalat] = useState("");

  // Aturan sama dengan di server, supaya kesalahan ketahuan tanpa menunggu jaringan
  function validasi(): string | null {
    if (!lama) return "Password lama wajib diisi.";
    if (baru.length < 8) return "Password baru minimal 8 karakter.";
    if (!/[A-Za-z]/.test(baru) || !/\d/.test(baru)) return "Password baru harus mengandung huruf dan angka.";
    if (baru === lama) return "Password baru harus berbeda dari password lama.";
    if (baru !== konfirmasi) return "Konfirmasi password tidak sama.";
    return null;
  }

  const simpan = useMutation({
    mutationFn: () =>
      api<{ message: string }>("ubah-password", {
        method: "POST",
        body: { password_lama: lama, password_baru: baru, password_baru_confirmation: konfirmasi },
      }),
    onSuccess: () => {
      toast.success("Password diubah", { description: "Perangkat lain yang memakai akun ini keluar otomatis." });
      setLama("");
      setBaru("");
      setKonfirmasi("");
      setGalat("");
    },
    onError: (e) => setGalat(e.message),
  });

  function kirim(e: FormEvent) {
    e.preventDefault();

    const masalah = validasi();
    setGalat(masalah ?? "");

    if (!masalah) simpan.mutate();
  }

  const jenis = tampil ? "text" : "password";
  const gaya =
    "mt-1 w-full rounded-2xl border border-gray-300 bg-white/80 px-4 py-3 text-base outline-none focus:ring-2 focus:ring-orange-500";

  return (
    <form onSubmit={kirim} className="space-y-3 rounded-3xl border border-white/80 bg-white/70 p-6 backdrop-blur">
      <div>
        <h2 className="text-lg font-semibold">Ubah password</h2>
        <p className="text-sm text-gray-500">Minimal 8 karakter, mengandung huruf dan angka.</p>
      </div>

      <label className="block text-sm font-medium text-gray-600">
        Password lama
        <input type={jenis} value={lama} onChange={(e) => setLama(e.target.value)} autoComplete="current-password" className={gaya} />
      </label>

      <label className="block text-sm font-medium text-gray-600">
        Password baru
        <input type={jenis} value={baru} onChange={(e) => setBaru(e.target.value)} autoComplete="new-password" className={gaya} />
      </label>

      <label className="block text-sm font-medium text-gray-600">
        Ulangi password baru
        <input type={jenis} value={konfirmasi} onChange={(e) => setKonfirmasi(e.target.value)} autoComplete="new-password" className={gaya} />
      </label>

      <button type="button" onClick={() => setTampil(!tampil)} className="text-sm text-orange-600">
        {tampil ? "Sembunyikan password" : "Tampilkan password"}
      </button>

      {galat && <p className="text-sm text-red-600">{galat}</p>}

      <button
        type="submit"
        disabled={simpan.isPending}
        className="w-full rounded-2xl bg-orange-600 py-3 font-semibold text-white disabled:opacity-60"
      >
        {simpan.isPending ? "Menyimpan…" : "Simpan password baru"}
      </button>
    </form>
  );
}