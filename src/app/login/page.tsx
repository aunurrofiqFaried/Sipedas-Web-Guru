import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import FormLogin from "./form-login";

export default async function HalamanLogin() {
  // Sudah login: langsung ke beranda
  if (await getSession()) redirect("/");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[radial-gradient(circle_at_95%_6%,rgba(249,115,22,0.28),transparent_55%),radial-gradient(circle_at_5%_94%,rgba(22,163,74,0.24),transparent_55%),linear-gradient(180deg,#fff,#fff7ed_50%,#fff)] px-6">
      <h1 className="text-4xl font-bold text-orange-600">Sipedas</h1>
      <p className="mb-8 mt-1 text-gray-500">Masuk dengan akun guru</p>
      <FormLogin />
    </main>
  );
}