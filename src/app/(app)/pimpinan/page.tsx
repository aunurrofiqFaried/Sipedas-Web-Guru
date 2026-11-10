import Link from "next/link";
import DashboardPimpinan from "./dashboard";

const menu = [
  { href: "/pimpinan/jurnal", judul: "Kepatuhan jurnal guru", ket: "Siapa yang rajin dan siapa yang melewatkan jurnal mengajar", aktif: true },
  { href: "#", judul: "Absensi dan sholat semua kelas", ket: "Pantau kehadiran siswa per kelas", aktif: false },
  { href: "#", judul: "Data guru", ket: "Beban jam, kepatuhan, dan piket", aktif: false },
  { href: "#", judul: "Jadwal sekolah", ket: "Jadwal semua kelas dan guru", aktif: false },
];

export default function Page() {
  return (
    <div className="space-y-8">
      <DashboardPimpinan />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Menu pimpinan</h2>

        <div className="grid gap-3 md:grid-cols-2">
          {menu.map((m) =>
            m.aktif ? (
              <Link
                key={m.judul}
                href={m.href}
                className="rounded-3xl border border-white/80 bg-white/70 p-5 shadow-sm backdrop-blur transition-shadow hover:shadow-md"
              >
                <p className="text-xl font-bold">{m.judul}</p>
                <p className="text-sm text-gray-500">{m.ket}</p>
              </Link>
            ) : (
              <div key={m.judul} className="rounded-3xl border border-dashed border-gray-300 bg-white/40 p-5">
                <p className="text-xl font-bold text-gray-400">{m.judul}</p>
                <p className="text-sm text-gray-400">{m.ket} · segera hadir</p>
              </div>
            ),
          )}
        </div>
      </section>
    </div>
  );
}