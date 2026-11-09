import { getSession } from "@/lib/session";

export default async function Profil() {
  const user = await getSession();

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Profil</h1>
      <div className="rounded-3xl border border-white/80 bg-white/70 p-6 backdrop-blur">
        <p className="text-xl font-bold">{user?.name}</p>
        <p className="text-gray-500">@{user?.username}</p>
        <p className="mt-2 text-sm">NIP: {user?.nip ?? "-"}</p>
        <p className="text-sm">Peran: {user?.role}{user?.is_wali_kelas ? " · wali kelas" : ""}</p>
      </div>
    </div>
  );
}