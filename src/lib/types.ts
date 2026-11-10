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
  piket?: PiketMinggu[];
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

export type PiketMinggu = {
  id: number;
  hari: number;
  jam_ke_mulai: number;
  jam_ke_selesai: number;
  jam_mulai: string;
  jam_selesai: string;
  tugas: string | null;
};

export type Pengumuman = {
  id: number;
  judul: string;
  isi: string;
  tingkat: "biasa" | "penting";
  tanggal: string;
  berlaku_sampai: string | null;
  pembuat: string | null;
};

export type PengumumanResponse = {
  belum_dibaca: number;
  terakhir_dibaca_id: number;
  data: Pengumuman[];
};

export type BarisJurnal = {
  id: number;
  tanggal: string;
  hari: string;
  tanggal_label: string;
  kelas: string | null;
  konsentrasi: string | null;
  jam_ke_mulai: number | null;
  jam_ke_selesai: number | null;
  jumlah_siswa: number;
  hadir: number | null;
  tidak_hadir: number | null;
  nama_tidak_hadir: string[];
  materi: string;
  catatan: string | null;
};

export type RekapJurnal = {
  guru: { nama: string; nip: string | null };
  mapel: IdNama;
  kelas: IdNama | null;
  periode: { dari: string; sampai: string; label: string };
  ringkasan: { pertemuan: number; jam_pelajaran: number; rata_kehadiran: number | null };
  baris: BarisJurnal[];
};

export type KolomHadir = { tanggal: string; label: string; hadir: number; tidak_hadir: number };

export type BarisHadir = {
  id: number;
  nama: string;
  jk: string | null;
  status: string[]; // "H", "S", "I", "A", atau "" (belum diabsen)
  hadir: number;
  sakit: number;
  izin: number;
  alpa: number;
};

export type RekapDaftarHadir = {
  guru: { nama: string; nip: string | null };
  mapel: IdNama;
  kelas: { id: number; nama: string; konsentrasi: string | null };
  periode: { dari: string; sampai: string; label: string };
  semester: string;
  kolom: KolomHadir[];
  siswa: BarisHadir[];
  ringkasan: { pertemuan: number; jumlah_siswa: number; rata_kehadiran: number | null };
};

export type BarisPoin = {
  id: number;
  nis: string;
  nama: string;
  kejadian: number;
  poin_pelanggaran: number;
  remisi: number;
  poin_aktif: number;
  level: number;
  sp: { nama: string; level: number; status: string } | null;
};

export type RekapPoin = {
  kelas: { id: number; nama: string };
  wali: { nama: string; nip: string | null } | null;
  tahun_ajaran: string;
  periode: { dari: string; sampai: string; label: string };
  aturan: { level: number; nama: string; batas_poin: number }[];
  ringkasan: {
    jumlah_siswa: number;
    kejadian: number;
    poin_pelanggaran: number;
    remisi: number;
    siswa_bermasalah: number;
    siswa_sp: number;
  };
  kategori: { kategori: string; jumlah: number; poin: number }[];
  jenis_terbanyak: { nama: string; jumlah: number; poin: number }[];
  per_bulan: { label: string; jumlah: number; poin: number }[];
  siswa: BarisPoin[];
};

export type SholatHitung = { hadir: number; tidak_hadir: number; berhalangan: number };

export type BarisSholat = {
  id: number;
  nis: string;
  nama: string;
  jk: string | null;
  dhuhur: SholatHitung;
  ashar: SholatHitung;
  hadir: number;
  wajib: number;
  persen: number | null;
};

export type RekapSholat = {
  kelas: { id: number; nama: string };
  wali: { nama: string; nip: string | null } | null;
  tahun_ajaran: string;
  periode: { dari: string; sampai: string; label: string };
  ringkasan: {
    peserta: number;
    hari_tercatat: number;
    persen: number | null;
    persen_dhuhur: number | null;
    persen_ashar: number | null;
  };
  waktu: { dhuhur: SholatHitung; ashar: SholatHitung };
  per_bulan: { label: string; hadir: number; tidak_hadir: number; persen: number | null }[];
  terbanyak_tidak_hadir: { nama: string; jumlah: number }[];
  siswa: BarisSholat[];
};

export type GuruKepatuhan = {
  id: number;
  nama: string;
  nip: string | null;
  sesi_per_minggu: number;
  seharusnya: number;
  terisi: number;
  terlewat: number;
  persen: number | null;
  status: "baik" | "cukup" | "kurang" | null;
  terakhir_isi: string | null;
};

export type KepatuhanJurnal = {
  periode: { dari: string; sampai: string; dihitung_sampai: string; label: string };
  ringkasan: {
    guru: number;
    hari_efektif: number;
    seharusnya: number;
    terisi: number;
    terlewat: number;
    persen: number | null;
    baik: number;
    cukup: number;
    kurang: number;
  };
  mingguan: { label: string; seharusnya: number; terisi: number; persen: number | null }[];
  guru: GuruKepatuhan[];
};

export type SesiTerlewat = {
  tanggal: string;
  hari: string;
  tanggal_label: string;
  kelas: string | null;
  mapel: string | null;
  jam_ke_mulai: number;
  jam_ke_selesai: number;
  jam_mulai: string;
  jam_selesai: string;
};

export type DetailKepatuhan = {
  guru: { id: number; nama: string; nip: string | null };
  periode: { dari: string; sampai: string; dihitung_sampai: string; label: string };
  ringkasan: Omit<GuruKepatuhan, "id" | "nama" | "nip">;
  terlewat: SesiTerlewat[];
};

export type SholatRingkas = {
  hadir: number;
  tidak_hadir: number;
  berhalangan: number;
  persen: number | null;
  kelas: number;
};

export type DashboardPimpinanData = {
  diperbarui: string;
  hari: { tanggal: string; label: string; hari_ini: boolean; libur: string | null };
  ringkasan: {
    siswa: number;
    kelas: number;
    guru_mengajar: number;
    pelanggaran_bulan: { jumlah: number; poin: number; jumlah_lalu: number; poin_lalu: number };
    sp_menunggu: number;
    mendekati_sp: number;
  };
  absensi: {
    total_siswa: number;
    tercatat: number;
    hadir: number;
    sakit: number;
    izin: number;
    alpa: number;
    belum: number;
    persen: number | null;
    kelas_total: number;
    kelas_diabsen: number;
  };
  tren_absensi: {
    tanggal: string;
    label: string;
    persen: number | null;
    hadir: number;
    sakit: number;
    izin: number;
    alpa: number;
    total: number;
  }[];
  peta_panas: {
    tanggal: string[];
    kelas: { id: number; nama: string; jurusan: string; nilai: (number | null)[] }[];
  };
  kelas_belum: { id: number; nama: string; jurusan: string; siswa: number }[];
  kelas_terendah: {
    id: number;
    nama: string;
    jurusan: string;
    siswa: number;
    persen: number | null;
    hadir: number;
    tercatat: number;
  }[];
  sholat: { dhuhur: SholatRingkas; ashar: SholatRingkas; kelas_total: number };
  jurnal_hari: {
    total: number;
    terisi: number;
    terlewat: number;
    berjalan: number;
    persen: number | null;
    daftar_terlewat: {
      guru: string;
      kelas: string | null;
      mapel: string | null;
      jam_ke_mulai: number;
      jam_ke_selesai: number;
      jam_mulai: string;
      jam_selesai: string;
    }[];
  };
  kepatuhan: {
    ringkasan: KepatuhanJurnal["ringkasan"];
    mingguan: KepatuhanJurnal["mingguan"];
    terendah: GuruKepatuhan[];
  };
  pelanggaran: {
    mingguan: { label: string; jumlah: number }[];
    jenis_teratas: { nama: string; jumlah: number; poin: number }[];
  };
  sp: {
    menunggu: { siswa: string; kelas: string; aturan: string; poin: number; tanggal: string }[];
    mendekati: { nama: string; kelas: string; poin_aktif: number; sisa: number; menuju: string }[];
    poin_tertinggi: { nama: string; kelas: string; poin_aktif: number }[];
  };
  jurusan: {
    nama: string;
    kelas: number;
    siswa: number;
    hadir: number;
    tercatat: number;
    persen: number | null;
    pelanggaran_bulan: number;
  }[];
  peringatan: {
    tingkat: "danger" | "warn" | "info" | "ok";
    judul: string;
    detail: string | null;
    tautan: string | null;
  }[];
};