import { getSession } from "@/lib/session";
import TombolKeluar from "./tombol-keluar";

export default async function Beranda() {
  const user = await getSession();

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold">Halo, {user?.name}</h1>
      <p className="mt-1 text-gray-500">
        @{user?.username} · {user?.role}
        {user?.is_wali_kelas ? " · wali kelas" : ""}
      </p>

      <div className="mt-6">
        <TombolKeluar />
      </div>
    </main>
  );
}