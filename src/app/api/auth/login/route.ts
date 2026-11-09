import { NextResponse } from "next/server";
import { NAMA_COOKIE } from "@/lib/session";

export async function POST(request: Request) {
  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    return NextResponse.json({ message: "API_URL belum diatur di .env.local." }, { status: 500 });
  }

  const body = await request.json().catch(() => null);

  if (!body?.username || !body?.password) {
    return NextResponse.json({ message: "Username dan password wajib diisi." }, { status: 422 });
  }

  let res: Response;

  try {
    res = await fetch(`${apiUrl}/login`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        username: String(body.username).trim(),
        password: String(body.password),
        device_name: "Web Guru",
      }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ message: "Server tidak dapat dihubungi." }, { status: 502 });
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const pesanField = data?.errors ? Object.values<string[]>(data.errors)[0]?.[0] : undefined;

    return NextResponse.json(
      { message: res.status === 429 ? "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi." : pesanField ?? data?.message ?? "Login gagal." },
      { status: res.status },
    );
  }

  // Token disimpan di cookie httpOnly: tidak bisa dibaca JavaScript di browser
  const response = NextResponse.json({ user: data.user });

  response.cookies.set(NAMA_COOKIE, data.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 hari
  });

  return response;
}