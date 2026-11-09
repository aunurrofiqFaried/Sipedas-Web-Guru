import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { NAMA_COOKIE } from "@/lib/session";

type Konteks = { params: Promise<{ path: string[] }> };

async function teruskan(request: NextRequest, { params }: Konteks) {
  const { path } = await params;

  if (path.some((s) => s === ".." || s === ".")) {
    return NextResponse.json({ message: "Alamat tidak valid." }, { status: 400 });
  }

  const token = (await cookies()).get(NAMA_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ message: "Belum login." }, { status: 401 });
  }

  const target = new URL(`${process.env.API_URL}/${path.join("/")}`);
  target.search = request.nextUrl.search;

  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };

  const jenisIsi = request.headers.get("content-type");
  if (jenisIsi) headers["Content-Type"] = jenisIsi;

  const adaIsi = !["GET", "HEAD"].includes(request.method);

  let res: Response;

  try {
    res = await fetch(target, {
      method: request.method,
      headers,
      body: adaIsi ? await request.arrayBuffer() : undefined,
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ message: "Server tidak dapat dihubungi." }, { status: 502 });
  }

  const balasan = new NextResponse(res.body, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "application/json",
      ...(res.headers.get("content-disposition")
        ? { "Content-Disposition": res.headers.get("content-disposition")! }
        : {}),
    },
  });

  // Token ditolak Laravel (akun dinonaktifkan atau token dicabut): hapus cookie
  if (res.status === 401) balasan.cookies.delete(NAMA_COOKIE);

  return balasan;
}

export { teruskan as GET, teruskan as POST, teruskan as PUT, teruskan as PATCH, teruskan as DELETE };