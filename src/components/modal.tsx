"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({
  judul,
  tutup,
  children,
}: {
  judul: string;
  tutup: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const tombol = (e: KeyboardEvent) => e.key === "Escape" && tutup();

    document.addEventListener("keydown", tombol);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", tombol);
      document.body.style.overflow = "";
    };
  }, [tutup]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:items-center" onClick={tutup}>
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88dvh] w-full max-w-lg flex-col rounded-t-3xl bg-white shadow-2xl md:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-lg font-bold">{judul}</h2>
          <button onClick={tutup} aria-label="Tutup" className="rounded-full p-1.5 hover:bg-gray-100">
            <X className="size-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">{children}</div>
      </div>
    </div>
  );
}