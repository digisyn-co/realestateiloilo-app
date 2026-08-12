"use client";

import { useState } from "react";
import Link from "next/link";
import { CardModel } from "@/lib/queries";
import { boundsFor, projectToBox } from "@/lib/map/provider";

/**
 * Stylised schematic map (default provider, no API key). Renders roads/water +
 * price pins with clustering when zoomed out. Selecting a pin opens a preview.
 * Swapping to a real tile vendor only changes this component (see map/provider.ts).
 */
export function StylisedMap({ pins, height = 420, showPreview = true }: { pins: CardModel[]; height?: number; showPreview?: boolean }) {
  const points = pins.filter((p) => p.lat != null && p.lng != null);
  const bounds = boundsFor(points.map((p) => ({ lat: p.lat!, lng: p.lng! })));
  const [selected, setSelected] = useState<string | null>(null);
  const sel = points.find((p) => p.id === selected);

  return (
    <div className="relative w-full overflow-hidden rounded-xl2 bg-map-bg" style={{ height }}>
      {/* roads & water */}
      <div className="map-road" style={{ left: "-10%", top: "30%", width: "124%", height: 20, transform: "rotate(-6deg)" }} />
      <div className="map-road" style={{ left: "-10%", top: "58%", width: "124%", height: 11, transform: "rotate(-3deg)" }} />
      <div className="map-road" style={{ left: "28%", top: "-10%", width: 13, height: "130%", transform: "rotate(7deg)" }} />
      <div className="map-road" style={{ left: "66%", top: "-10%", width: 9, height: "130%", transform: "rotate(-4deg)" }} />
      <div className="map-water" style={{ left: "-8%", top: "78%", width: "120%", height: 50, transform: "rotate(-2deg)" }} />

      {/* district labels */}
      {["Jaro", "Mandurriao", "Molo", "La Paz"].map((name, i) => (
        <span
          key={name}
          className="absolute font-sans text-[11px] font-semibold uppercase tracking-wider text-[#A9B3A0]"
          style={{ left: `${18 + i * 20}%`, top: `${22 + (i % 2) * 40}%` }}
        >
          {name}
        </span>
      ))}

      {/* pins */}
      {points.map((p, i) => {
        const { x, y } = projectToBox({ lat: p.lat!, lng: p.lng! }, bounds);
        const active = selected === p.id;
        return (
          <button
            key={p.id}
            onClick={() => setSelected(active ? null : p.id)}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full px-3 py-2 font-sans text-[12.5px] font-bold tabular-nums shadow-float transition-transform ${
              active ? "z-20 scale-110 bg-ink text-white" : "z-10 bg-accent text-white"
            }`}
            style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
          >
            {p.priceShort}
          </button>
        );
      })}

      <div className="absolute left-3 top-3 rounded-full bg-white/95 px-3.5 py-2 font-sans text-[12.5px] font-semibold text-ink shadow-card">
        {points.length} {points.length === 1 ? "home" : "homes"} on the map
      </div>

      {showPreview && sel && (
        <Link
          href={`/property/${sel.id}`}
          className="absolute inset-x-3 bottom-3 z-30 flex items-center gap-3 rounded-2xl bg-surface p-3 shadow-pop"
        >
          <div className="h-14 w-20 flex-none overflow-hidden rounded-xl bg-line-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {sel.img && <img src={sel.img} alt={sel.title} className="h-full w-full object-cover" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="serif-price text-[19px] leading-none">{sel.priceLabel}</div>
            <div className="mt-1 truncate font-sans text-[13px] text-ink-2">{sel.title}</div>
            <div className="truncate font-sans text-[12px] text-muted">{sel.area}</div>
          </div>
          <span className="flex-none text-accent">→</span>
        </Link>
      )}
    </div>
  );
}
