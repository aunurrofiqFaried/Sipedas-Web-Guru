export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<T> {
  const res = await fetch(`/api/proxy/${path}`, {
    method: init?.method ?? "GET",
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });

  // Sesi habis atau akun dinonaktifkan: kembali ke login
  if (res.status === 401) {
    window.location.href = "/login";
    throw new ApiError("Sesi berakhir.", 401);
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const pesanField = data?.errors ? Object.values<string[]>(data.errors)[0]?.[0] : undefined;

    throw new ApiError(pesanField ?? data?.message ?? `Terjadi kesalahan (kode ${res.status})`, res.status);
  }

  return data as T;
}