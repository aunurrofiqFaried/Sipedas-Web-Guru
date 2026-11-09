"use client";

import { useState } from "react";
import JurnalHariIni from "./hari-ini";
import RiwayatJurnal from "./riwayat";

export default function JurnalHalaman() {
  const [tab, setTab] = useState<"hari-ini" | "riwayat">("hari-ini");

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Jurnal mengajar</h1>

      <div className="grid max-w-sm grid-cols-2 gap-1 rounded-2xl bg-gray-100 p-1 text-sm font-semibold">
        {(["hari-ini", "riwayat"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-xl py-2 ${tab === t ? "bg-white text-orange-600 shadow-sm" : "text-gray-500"}`}
          >
            {t === "hari-ini" ? "Hari ini" : "Riwayat"}
          </button>
        ))}
      </div>

      {tab === "hari-ini" ? <JurnalHariIni /> : <RiwayatJurnal />}
    </div>
  );
}