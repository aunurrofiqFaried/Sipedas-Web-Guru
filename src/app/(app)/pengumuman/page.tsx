import { getSession } from "@/lib/session";
import { PERAN_PIMPINAN } from "@/lib/peran";
import DaftarPengumuman from "./daftar-pengumuman";

export default async function Page() {
  const user = await getSession();

  return <DaftarPengumuman bolehKelola={!!user && PERAN_PIMPINAN.includes(user.role)} />;
}