import SiswaAbsensi from "./siswa-absensi";

export default async function Page({ params }: { params: Promise<{ kelasId: string }> }) {
  const { kelasId } = await params;

  return <SiswaAbsensi kelasId={Number(kelasId)} />;
}