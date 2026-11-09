import SholatSiswa from "./sholat-siswa";

export default async function Page({ params }: { params: Promise<{ waktu: string; kelasId: string }> }) {
  const { waktu, kelasId } = await params;

  return <SholatSiswa waktu={waktu} kelasId={Number(kelasId)} />;
}