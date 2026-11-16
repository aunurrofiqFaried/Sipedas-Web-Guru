import { getSession } from "@/lib/session";
import { PERAN_PIMPINAN } from "@/lib/peran";
import DaftarPengumuman from "./daftar-pengumuman";
import { adalahPimpinan } from "@/lib/peran";

export default async function Page() {
  const user = await getSession();

  return <DaftarPengumuman bolehKelola={!!user && adalahPimpinan(user)} />;
}