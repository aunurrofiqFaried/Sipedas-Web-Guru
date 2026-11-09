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