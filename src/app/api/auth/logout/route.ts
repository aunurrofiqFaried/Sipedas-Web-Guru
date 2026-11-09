import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { NAMA_COOKIE } from "@/lib/session";

export async function POST() {
  const token = (await cookies()).get(NAMA_COOKIE)?.value;

  // Cabut token di Laravel; tetap keluar walau server tidak terjangkau
  if (token) {
    await fetch(`${process.env.API_URL}/logout`, {
      method: "POST",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
    }).catch(() => null);
  }

  const response = NextResponse.json({ message: "Berhasil keluar." });
  response.cookies.delete(NAMA_COOKIE);

  return response;
}