import Link from "next/link";
import { getSession } from "@/lib/session";
import { adalahPimpinan } from "@/lib/peran";
import DashboardPimpinan from "./dashboard";

const menu = [
  {
    href: "/pimpinan/jurnal",
    judul: "Kepatuhan jurnal guru",
    ket: "Siapa yang rajin dan siapa yang melewatkan jurnal mengajar",
    ketKaprodi: "Kepatuhan jurnal guru yang mengajar di jurusan",
  },
  {
    href: "/pimpinan/kehadiran",
    judul: "Absensi dan sholat semua kelas",
    judulKaprodi: "Absensi dan sholat kelas",
    ket: "Pantau kehadiran siswa per kelas",
    ketKaprodi: "Pantau kehadiran siswa di kelas-kelas jurusan",
  },
  {
    href: "/pimpinan/guru",
    judul: "Data guru",
    ket: "Beban jam, kepatuhan, dan piket",
    ketKaprodi: "Beban jam, kepatuhan, dan piket guru jurusan",
  },
  {
    href: "/pimpinan/jadwal",
    judul: "Jadwal sekolah",
    judulKaprodi: "Jadwal jurusan",
    ket: "Jadwal semua kelas dan guru",
    ketKaprodi: "Jadwal kelas dan guru di jurusan",
  },
];

export default async function Page() {
  const user = await getSession();
  const pimpinan = adalahPimpinan(user);

  // Nama depan saja: "Dr. Budi, M.Pd" -> "Dr."
  const nama = (user?.name ?? "").split(" ")[0].split(",")[0] || "Pimpinan";

  return (
    <div className="space-y-6">
      {pimpinan ? (
        <DashboardPimpinan nama={nama} />
      ) : (
        <section className="rounded-3xl border border-white/80 bg-white/70 p-6 backdrop-blur">
          <p className="text-sm text-gray-500">Kepala program keahlian</p>
          <h1 className="text-2xl font-bold">{user?.kaprodi_jurusan?.nama ?? "Jurusan"}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Data di bawah hanya mencakup kelas dan guru di jurusan {user?.kaprodi_jurusan?.kode}.
          </p>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{pimpinan ? "Menu pimpinan" : "Menu kaprodi"}</h2>

        <div className="grid gap-3 md:grid-cols-2">
          {menu.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="rounded-3xl border border-white/80 bg-white/70 p-5 shadow-sm backdrop-blur transition-shadow hover:shadow-md"
            >
              <p className="text-xl font-bold">{pimpinan ? m.judul : (m.judulKaprodi ?? m.judul)}</p>
              <p className="text-sm text-gray-500">{pimpinan ? m.ket : m.ketKaprodi}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}