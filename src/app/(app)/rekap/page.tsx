import Link from "next/link";

const menu = [
  { href: "/rekap/absensi", judul: "Rekap kehadiran kelas", ket: "Hadir, sakit, izin, dan alpa tiap siswa per bulan", aktif: true },
  { href: "#", judul: "Rekap jurnal", ket: "Jurnal per guru, kelas, dan periode", aktif: false },
  { href: "#", judul: "Rekap poin pelanggaran", ket: "Poin dan remisi per kelas atau siswa", aktif: false },
  { href: "#", judul: "Rekap sholat", ket: "Kehadiran sholat per kelas", aktif: false },
];

export default function Page() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Rekap</h1>

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
    </div>
  );
}