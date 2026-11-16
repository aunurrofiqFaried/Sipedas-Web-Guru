import { redirect } from "next/navigation";
import { bolehPantau } from "@/lib/peran";
import { getSession } from "@/lib/session";

export default async function PimpinanLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();

  // Server juga menolak peran lain; ini mencegah halaman terbuka lewat alamat langsung.
  // Pimpinan melihat semua data, kaprodi hanya jurusannya (disaring server).
  if (!user || !bolehPantau(user)) redirect("/");

  return children;
}