"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { UNIT_TYPES, UNIT_STATUS, UNIT_STATUS_LABELS } from "@/lib/enums";

export function UnitFilterBar({ buildings }: { buildings: { id: string; name: string }[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const pathname = usePathname();

  function set(key: string, value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {buildings.length > 0 && (
        <select value={sp.get("building") || ""} onChange={(e) => set("building", e.target.value)} className="dfield max-w-[180px] py-2">
          <option value="">All buildings</option>
          {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      )}
      <select value={sp.get("unitType") || ""} onChange={(e) => set("unitType", e.target.value)} className="dfield max-w-[150px] py-2">
        <option value="">All types</option>
        {UNIT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <select value={sp.get("status") || ""} onChange={(e) => set("status", e.target.value)} className="dfield max-w-[160px] py-2">
        <option value="">All statuses</option>
        {UNIT_STATUS.map((s) => <option key={s} value={s}>{UNIT_STATUS_LABELS[s]}</option>)}
      </select>
      <select value={sp.get("sort") || ""} onChange={(e) => set("sort", e.target.value)} className="dfield max-w-[150px] py-2">
        <option value="">Unit no.</option>
        <option value="price_asc">Price ↑</option>
        <option value="price_desc">Price ↓</option>
        <option value="area_desc">Largest</option>
      </select>
    </div>
  );
}
