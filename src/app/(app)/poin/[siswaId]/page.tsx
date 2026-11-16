import { getSession } from "@/lib/session";
import PoinSiswaDetail from "./poin-siswa-detail";
import { punyaPeran } from "@/lib/peran";

export default async function Page({ params }: { params: Promise<{ siswaId: string }> }) {
  const { siswaId } = await params;
  const user = await getSession();

  // Server juga menolak role lain; ini hanya menentukan apakah panel wali ditampilkan
  const bolehKontak = punyaPeran(user, "guru_bk", "kesiswaan", "admin");

  return <PoinSiswaDetail siswaId={Number(siswaId)} bolehKontak={bolehKontak} />;
}