import { getSession } from "@/lib/session";
import DaftarKelas from "./daftar-kelas";

export default async function Page() {
  const user = await getSession();

  return <DaftarKelas waliKelas={user?.is_wali_kelas ?? false} />;
}