"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function FormLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [tampil, setTampil] = useState(false);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState("");

  async function kirim(e: FormEvent) {
    e.preventDefault();
    if (memuat) return;

    setMemuat(true);
    setGalat("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setGalat(data.message ?? "Login gagal.");
        return;
      }

      setPassword("");
      router.replace("/");
      router.refresh();
    } catch {
      setGalat("Tidak dapat terhubung. Periksa koneksi internet.");
    } finally {
      setMemuat(false);
    }
  }

  return (
    <form
      onSubmit={kirim}
      className="flex w-full max-w-sm flex-col gap-4 rounded-3xl border border-white/80 bg-white/70 p-6 shadow-lg shadow-orange-500/10 backdrop-blur-xl"
    >
      <label className="flex flex-col gap-1.5 text-sm text-gray-500">
        Username
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="username"
          disabled={memuat}
          required
          className="rounded-2xl border border-gray-300 bg-white/80 px-4 py-3 text-base text-gray-900 outline-none focus:border-transparent focus:ring-2 focus:ring-orange-500"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm text-gray-500">
        Password
        <input
          type={tampil ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          disabled={memuat}
          required
          className="rounded-2xl border border-gray-300 bg-white/80 px-4 py-3 text-base text-gray-900 outline-none focus:border-transparent focus:ring-2 focus:ring-orange-500"
        />
      </label>

      <button
        type="button"
        onClick={() => setTampil(!tampil)}
        className="self-start text-sm text-orange-600"
      >
        {tampil ? "Sembunyikan password" : "Tampilkan password"}
      </button>

      {galat && <p className="text-sm text-red-600">{galat}</p>}

      <button
        type="submit"
        disabled={memuat}
        className="rounded-2xl bg-orange-600 py-3.5 font-semibold text-white disabled:opacity-60"
      >
        {memuat ? "Memproses…" : "Masuk"}
      </button>
    </form>
  );
}