export type IdNama = { id: number; nama: string };
export type Ruang = { id: number; nama: string; tipe: string };

export type Jadwal = {
  id: number;
  kelas: IdNama | null;
  mapel: IdNama | null;
  ruang: Ruang | null;
  jam_ke_mulai: number;
  jam_ke_selesai: number;
  jam_mulai: string;
  jam_selesai: string;
  sudah_jurnal: boolean;
  bisa_isi_jurnal: boolean;
};

export type Piket = {
  jam_ke_mulai: number;
  jam_ke_selesai: number;
  jam_mulai: string;
  jam_selesai: string;
  tugas: string | null;
};

export type Libur = {
  judul: string;
  keterangan: string | null;
  tanggal_mulai: string;
  tanggal_selesai: string;
};

export type Peringatan = { judul: string; keterangan: string | null };

export type JadwalHariIni = {
  tanggal: string;
  jam_server: string;
  libur: Libur | null;
  peringatan: Peringatan[];
  data: Jadwal[];
  piket: Piket[];
};

export type KelasWali = {
  id: number;
  nama: string;
  jumlah_siswa: number;
  kehadiran_persen: number | null;
  sakit: number;
  izin: number;
  alpa: number;
  hari_tercatat: number;
};

export type Statistik = {
  mengajar: {
    jumlah_kelas: number;
    jumlah_mapel: number;
    jam_per_minggu: number;
    jumlah_siswa: number;
    hari_terpadat: { hari: number; jam: number } | null;
  };
  jurnal_bulan_ini: { terisi: number; seharusnya: number; persen: number | null };
  kelas_wali: KelasWali[];
  pelanggaran_dicatat: number;
};

export type StatusAbsen = "hadir" | "sakit" | "izin" | "alpa";

export type KelasAbsen = {
  id: number;
  nama: string;
  alasan: "wali" | "jadwal" | "pengganti" | "admin" | null;
  jumlah_siswa: number;
  sudah_diabsen: number;
};

export type KelasHariIni = {
  tanggal: string;
  libur?: Libur | null;
  data: KelasAbsen[];
};

export type SiswaAbsen = {
  id: number;
  nis: string;
  nama: string;
  jenis_kelamin: string | null;
  status: StatusAbsen | null;
  keterangan: string | null;
  ada_nomor_wali: boolean;
  wa_link: string | null;
};

export type SiswaKelas = {
  tanggal: string;
  kelas: IdNama;
  data: SiswaAbsen[];
};

export type StatusSholat = "hadir" | "tidak_hadir" | "berhalangan";

export type KelasSholat = {
  id: number;
  nama: string;
  jumlah_peserta: number;
  absensi_harian_siap: boolean;
  dhuhur: number;
  ashar: number;
};

export type SiswaSholat = {
  id: number;
  nis: string;
  nama: string;
  jenis_kelamin: string | null;
  status_harian: StatusAbsen | null;
  terkunci: boolean;
  status: StatusSholat | null;
};

export type SholatSiswaResponse = {
  tanggal: string;
  waktu: string;
  kelas: IdNama;
  data: SiswaSholat[];
};

export type KelasRekap = { id: number; nama: string; jumlah_siswa: number };

export type RekapSiswa = {
  id: number;
  nis: string;
  nama: string;
  hadir: number;
  sakit: number;
  izin: number;
  alpa: number;
};

export type RekapAbsensi = {
  kelas: IdNama;
  periode: { label: string; dari: string; sampai: string };
  hari_tercatat: number;
  total: { hadir: number; sakit: number; izin: number; alpa: number };
  siswa: RekapSiswa[];
};

export type JurnalItem = {
  id: number;
  jadwal_id: number;
  tanggal: string;
  materi: string;
  catatan: string | null;
  kelas: IdNama | null;
  mapel: IdNama | null;
  jam_ke_mulai: number | null;
  jam_ke_selesai: number | null;
  jam_mulai: string | null;
  jam_selesai: string | null;
};

export type JurnalBulan = { bulan: string; data: JurnalItem[] };

export type JadwalMinggu = {
  id: number;
  hari: number;
  kelas: IdNama | null;
  mapel: IdNama | null;
  ruang: Ruang | null;
  jam_ke_mulai: number;
  jam_ke_selesai: number;
  jam_mulai: string;
  jam_selesai: string;
};

export type JadwalSaya = {
  tahun_ajaran: { nama: string; tanggal_mulai: string; tanggal_selesai: string };
  data: JadwalMinggu[];
};

export type Acara = {
  id: number;
  judul: string;
  jenis: "libur" | "peringatan";
  tanggal_mulai: string;
  tanggal_selesai: string;
  keterangan: string | null;
};

export type SiswaCari = { id: number; nis: string; nama: string; kelas: string | null };

export type JenisPelanggaran = { id: number; nama: string; kategori: string | null; poin: number };

export type JenisRemisi = { id: number; nama: string; poin: number; keterangan: string | null };

export type CatatanPoin = {
  id: number;
  poin: number;
  tanggal: string;
  keterangan: string | null;
  jenis: { id: number; nama: string } | null;
  pencatat: { id: number; name: string } | null;
};

export type SpSiswa = {
  id: number;
  status: "menunggu" | "disetujui" | "ditolak";
  total_poin_saat_terbit: number;
  aturan: { id: number; nama: string; level: number; batas_poin: number } | null;
};

export type PoinSiswa = {
  siswa: { id: number; nis: string; nama: string };
  tahun_ajaran: string;
  total_poin: number;
  total_pelanggaran: number;
  total_remisi: number;
  sp: SpSiswa[];
  riwayat: CatatanPoin[];
  remisi: CatatanPoin[];
};

export type KontakWali = {
  siswa: { id: number; nis: string; nama: string; kelas: string | null };
  wali: { nama: string | null; hubungan: string | null; no_hp: string | null };
  ada_nomor_wali: boolean;
  wa_link: string | null;
  riwayat: { id: number; tujuan: string; catatan: string | null; oleh: string | null; waktu: string }[];
};