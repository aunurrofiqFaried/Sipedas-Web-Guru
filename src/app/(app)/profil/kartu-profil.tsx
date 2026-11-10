import type { User } from "@/lib/session";

const labelRole: Record<string, string> = {
  admin: "Admin",
  guru: "Guru",
  guru_bk: "Guru BK",
  kesiswaan: "Waka Kesiswaan",
  kepala_sekolah: "Kepala Sekolah",
  waka_kurikulum: "Waka Kurikulum",
  waka_sdm: "Waka SDM",
  staf: "Staf",
};

export default function KartuProfil({ user }: { user: User }) {
  const inisial =
    user.name
      .split(/[ ,]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((k) => k[0].toUpperCase())
      .join("") || "?";

  return (
    <section className="rounded-3xl border border-white/80 bg-white/70 p-6 backdrop-blur">
      <div className="flex items-center gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-green-600 text-xl font-bold text-white">
          {inisial}
        </div>

        <div className="min-w-0">
          <p className="truncate text-xl font-bold">{user.name}</p>
          <p className="text-sm text-gray-500">@{user.username}</p>

          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-800">
              {labelRole[user.role] ?? user.role}
            </span>
            {user.is_wali_kelas && (
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                Wali kelas
              </span>
            )}
          </div>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-gray-50 p-3">
          <dt className="text-gray-500">Username</dt>
          <dd className="font-semibold">{user.username}</dd>
        </div>
        <div className="rounded-2xl bg-gray-50 p-3">
          <dt className="text-gray-500">NIP</dt>
          <dd className="font-semibold">{user.nip ?? "-"}</dd>
        </div>
      </dl>
    </section>
  );
}