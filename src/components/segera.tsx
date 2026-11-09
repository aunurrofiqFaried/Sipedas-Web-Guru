export default function Segera({ judul, keterangan }: { judul: string; keterangan: string }) {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">{judul}</h1>
      <div className="rounded-3xl border border-white/80 bg-white/70 p-6 backdrop-blur">
        <p className="font-semibold text-orange-600">Segera hadir</p>
        <p className="mt-1 text-gray-600">{keterangan}</p>
      </div>
    </div>
  );
}