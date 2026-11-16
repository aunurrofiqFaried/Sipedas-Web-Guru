import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import Providers from "@/app/providers";
import Shell from "@/components/shell";

// Pemeriksaan login membaca cookie dan memanggil API, jadi harus di dalam Suspense
async function CangkangAplikasi({ children }: { children: React.ReactNode }) {
  const user = await getSession();

  if (!user) redirect("/login");

  return (
    <Providers>
      <Shell user={user}>{children}</Shell>
    </Providers>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <CangkangAplikasi>{children}</CangkangAplikasi>
    </Suspense>
  );
}