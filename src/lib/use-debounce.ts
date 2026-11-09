import { useEffect, useState } from "react";

// Nilai baru baru dipakai setelah berhenti berubah selama ms milidetik
export function useDebounce<T>(nilai: T, ms: number): T {
  const [v, setV] = useState(nilai);

  useEffect(() => {
    const t = setTimeout(() => setV(nilai), ms);
    return () => clearTimeout(t);
  }, [nilai, ms]);

  return v;
}