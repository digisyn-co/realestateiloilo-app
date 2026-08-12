"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { getCompare, removeFromCompare } from "@/lib/compare";
import { CardModel } from "@/lib/queries";
import { PropertyImage } from "@/components/PropertyImage";

export default function ComparePage() {
  const [items, setItems] = useState<CardModel[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const ids = getCompare();
    if (ids.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }
    const res = await fetch(`/api/listings?ids=${ids.join(",")}`);
    const data = await res.json();
    setItems(data.items || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const sync = () => load();
    window.addEventListener("compare-change", sync);
    return () => window.removeEventListener("compare-change", sync);
  }, []);

  const rows: { label: string; get: (p: CardModel) => string }[] = [
    { label: "Price", get: (p) => p.priceLabel },
    { label: "Type", get: (p) => p.type },
    { label: "For", get: (p) => p.saleRent },
    { label: "Location", get: (p) => p.area },
    { label: "Specs", get: (p) => p.specChips.join(" · ") || "—" },
    { label: "Price / sqm", get: (p) => p.perSqm || "—" },
    { label: "Verified", get: (p) => p.verified || "Not verified" },
    { label: "Freshness", get: (p) => p.freshness },
    { label: "Agent", get: (p) => p.agentName || "—" },
  ];

  if (loading) return <div className="py-16 text-center font-sans text-muted">Loading comparison…</div>;

  if (items.length === 0) {
    return (
      <div className="pt-6">
        <h1 className="mb-4 font-serif text-[30px] text-ink">Compare homes</h1>
        <div className="mx-auto max-w-md rounded-xl2 bg-surface p-11 text-center shadow-card">
          <div className="mb-3 font-serif text-[25px] text-ink">Nothing to compare yet.</div>
          <p className="mb-6 font-sans text-[14.5px] text-muted">Add two or three homes from the ··· menu on any card.</p>
          <Link href="/browse" className="btn-primary w-full">Start browsing</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-6">
      <h1 className="mb-4 font-serif text-[30px] text-ink">Compare homes</h1>
      <div className="overflow-x-auto pb-4">
        <div style={{ minWidth: 180 + items.length * 220 }}>
          <div className="grid gap-2.5" style={{ gridTemplateColumns: `160px repeat(${items.length}, 1fr)` }}>
            <div />
            {items.map((p) => (
              <div key={p.id} className="rounded-2xl bg-surface p-3 shadow-card">
                <Link href={`/property/${p.id}`} className="block aspect-[3/2] overflow-hidden rounded-xl bg-line-2">
                  <PropertyImage src={p.img} alt={p.title} placeholder={p.type} />
                </Link>
                <div className="mt-2 line-clamp-2 font-sans text-[13px] font-medium text-ink-2">{p.title}</div>
                <button onClick={() => removeFromCompare(p.id)} className="mt-1 inline-flex items-center gap-1 font-sans text-[12.5px] font-semibold text-accent">
                  <X size={13} /> Remove
                </button>
              </div>
            ))}
          </div>

          {rows.map((r, i) => (
            <div
              key={r.label}
              className={`mt-2.5 grid items-center gap-2.5 rounded-xl ${i % 2 ? "bg-transparent" : "bg-surface/60"}`}
              style={{ gridTemplateColumns: `160px repeat(${items.length}, 1fr)` }}
            >
              <div className="px-3 py-3 font-sans text-[12.5px] font-medium text-muted">{r.label}</div>
              {items.map((p) => (
                <div key={p.id} className="px-3 py-3 font-sans text-[13.5px] text-ink-2">
                  {r.get(p)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
