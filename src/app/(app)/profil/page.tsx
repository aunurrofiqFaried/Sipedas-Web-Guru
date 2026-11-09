import { getSession } from "@/lib/session";
import FormPassword from "./form-password";
import JadwalMingguan from "./jadwal-mingguan";
import KalenderMengajar from "./kalender-mengajar";
import KartuProfil from "./kartu-profil";

export default async function Profil() {
  const user = await getSession();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Profil</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <KartuProfil user={user} />
        <FormPassword />
      </div>

      <KalenderMengajar />
      <JadwalMingguan />
    </div>
  );
}