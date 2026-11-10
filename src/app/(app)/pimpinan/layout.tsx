import { redirect } from "next/navigation";
import { PERAN_PIMPINAN } from "@/lib/peran";
import { getSession } from "@/lib/session";

export default async function PimpinanLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();

  // Server juga menolak peran lain; ini mencegah halaman terbuka lewat alamat langsung
  if (!user || !PERAN_PIMPINAN.includes(user.role)) redirect("/");

  return children;
}