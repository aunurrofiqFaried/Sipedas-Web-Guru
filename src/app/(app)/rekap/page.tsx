import Link from "next/link";

const menu = [
  { href: "/rekap/absensi", judul: "Rekap kehadiran kelas", ket: "Hadir, sakit, izin, dan alpa tiap siswa per bulan", aktif: true },
  { href: "/rekap/jurnal", judul: "Rekap jurnal", ket: "Jurnal per mapel, kelas, dan periode dengan PDF resmi", aktif: true },
  { href: "/rekap/daftar-hadir", judul: "Daftar hadir", ket: "Daftar hadir siswa per mapel dan kelas, siap cetak PDF", aktif: true },
  { href: "/rekap/poin", judul: "Rekap poin pelanggaran", ket: "Poin, remisi, dan status SP per kelas dengan grafik dan PDF", aktif: true },
  { href: "/rekap/sholat", judul: "Rekap sholat", ket: "Kehadiran sholat Dhuhur dan Ashar per kelas (wali kelas, kesiswaan, kepala sekolah)", aktif: true },
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