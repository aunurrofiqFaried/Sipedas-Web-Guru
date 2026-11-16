import type { User } from "@/lib/session";

// Peran yang boleh melihat data seluruh sekolah dan memantau guru
export const PERAN_PIMPINAN = ["admin", "kepala_sekolah", "waka_kurikulum", "kesiswaan", "waka_sdm"];

export const LABEL_PERAN: Record<string, string> = {
  admin: "Admin",
  guru: "Guru",
  guru_bk: "Guru BK",
  kesiswaan: "Waka Kesiswaan",
  kepala_sekolah: "Kepala Sekolah",
  waka_kurikulum: "Waka Kurikulum",
  waka_sdm: "Waka SDM",
  staf: "Staf",
};

type PenggunaPeran = Pick<User, "role" | "roles" | "kaprodi_jurusan"> | null | undefined;

// Peran utama ditambah peran tambahan (server mengirim keduanya di roles)
export function semuaPeran(user: PenggunaPeran): string[] {
  if (!user) return [];
  return user.roles?.length ? user.roles : [user.role];
}

export function punyaPeran(user: PenggunaPeran, ...peran: string[]): boolean {
  return semuaPeran(user).some((p) => peran.includes(p));
}

export function adalahPimpinan(user: PenggunaPeran): boolean {
  return punyaPeran(user, ...PERAN_PIMPINAN);
}

export function adalahKaprodi(user: PenggunaPeran): boolean {
  return !!user?.kaprodi_jurusan;
}

// Boleh membuka menu pimpinan: pimpinan (semua data) atau kaprodi (data jurusannya)
export function bolehPantau(user: PenggunaPeran): boolean {
  return adalahPimpinan(user) || adalahKaprodi(user);
}

// Daftar label untuk ditampilkan, mis. ["Guru", "Admin", "Kaprodi RPL"]
export function labelPeran(user: PenggunaPeran): string[] {
  const label = semuaPeran(user).map((p) => LABEL_PERAN[p] ?? p);

  if (user?.kaprodi_jurusan) label.push(`Kaprodi ${user.kaprodi_jurusan.kode}`);

  return label;
}