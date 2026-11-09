import { cache } from "react";
import { cookies } from "next/headers";

export const NAMA_COOKIE = "sipedas_token";

export type User = {
  id: number;
  name: string;
  username: string;
  nip: string | null;
  role: string;
  is_wali_kelas: boolean;
};

// Menanyakan ke Laravel siapa yang sedang login (dipakai di server saja)
export const getSession = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(NAMA_COOKIE)?.value;

  if (!token) return null;

  try {
    const res = await fetch(`${process.env.API_URL}/me`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!res.ok) return null;

    return (await res.json()).user as User;
  } catch {
    return null;
  }
});