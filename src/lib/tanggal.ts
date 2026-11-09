export const namaHariPendek = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

const pad = (n: number) => String(n).padStart(2, "0");

export const keIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const keBulan = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

export function dariIso(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

// Senin = 1 ... Minggu = 7 (sama dengan hari di jadwal Laravel)
export const hariIso = (d: Date) => ((d.getDay() + 6) % 7) + 1;

export function geserBulan(bulan: string, delta: number): string {
  const [y, m] = bulan.split("-").map(Number);
  return keBulan(new Date(y, m - 1 + delta, 1));
}

export function labelBulan(bulan: string): string {
  const [y, m] = bulan.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date(y, m - 1, 1));
}

export function labelTanggal(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(dariIso(iso));
}

export function labelTanggalPendek(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", { weekday: "short", day: "numeric", month: "short" }).format(dariIso(iso));
}

// Semua hari pada satu bulan, ditambah jumlah sel kosong di depan (minggu mulai Senin)
export function susunKalender(bulan: string) {
  const [y, m] = bulan.split("-").map(Number);
  const jumlah = new Date(y, m, 0).getDate();
  const kosong = hariIso(new Date(y, m - 1, 1)) - 1;

  return {
    kosong,
    hari: Array.from({ length: jumlah }, (_, i) => keIso(new Date(y, m - 1, i + 1))),
  };
}