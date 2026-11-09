"use client";

import { useRouter } from "next/navigation";

export default function TombolKeluar() {
  const router = useRouter();

  async function keluar() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      onClick={keluar}
      className="rounded-2xl border border-red-600 px-5 py-2.5 font-medium text-red-600"
    >
      Keluar
    </button>
  );
}