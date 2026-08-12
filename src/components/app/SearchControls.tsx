"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search, SlidersHorizontal, Map, X } from "lucide-react";
import { PROPERTY_TYPES, PROPERTY_TYPE_LABELS } from "@/lib/enums";
import { ALL_AREAS } from "@/lib/iloilo";

const SORTS = [
  { v: "relevance", label: "Best match" },
  { v: "newest", label: "Newest" },
  { v: "price_asc", label: "Price ↑" },
  { v: "price_desc", label: "Price ↓" },
  { v: "area_desc", label: "Largest" },
];

export function SearchControls({ showMapLink = true }: { showMapLink?: boolean }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") || "");
  const [open, setOpen] = useState(false);

  function apply(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v == null || v === "") params.delete(k);
      else params.set(k, v);
    }
    params.delete("page");
    router.push(`/browse?${params.toString()}`);
  }

  const listingType = sp.get("listingType") || "";
  const active = (v: string, key = "listingType") => sp.get(key) === v;

  return (
    <div className="sticky top-[62px] z-30 -mx-4 border-b border-line-2 bg-app/95 px-4 py-3 backdrop-blur">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          apply({ q });
        }}
        className="flex items-center gap-2"
      >
        <div className="relative flex-1">
          <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="House in Jaro under ₱5M…"
            className="field pl-11"
          />
        </div>
        <button type="button" onClick={() => setOpen(true)} className="grid h-[50px] w-[50px] flex-none place-items-center rounded-2xl bg-surface shadow-card" aria-label="Filters">
          <SlidersHorizontal size={18} className="text-ink-2" />
        </button>
        {showMapLink && (
          <a href="/map" className="hidden h-[50px] flex-none items-center gap-2 rounded-2xl bg-surface px-4 font-sans text-[13px] font-semibold text-ink-2 shadow-card sm:flex">
            <Map size={16} /> Map
          </a>
        )}
      </form>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        <Chip active={!listingType} onClick={() => apply({ listingType: undefined })}>All</Chip>
        <Chip active={active("SALE")} onClick={() => apply({ listingType: "SALE" })}>For sale</Chip>
        <Chip active={active("RENT")} onClick={() => apply({ listingType: "RENT" })}>For rent</Chip>
        <Chip active={sp.get("verifiedOnly") === "1"} onClick={() => apply({ verifiedOnly: sp.get("verifiedOnly") === "1" ? undefined : "1" })}>
          Verified only
        </Chip>
        <select
          value={sp.get("sort") || "relevance"}
          onChange={(e) => apply({ sort: e.target.value })}
          className="chip flex-none appearance-none pr-3 outline-none"
          aria-label="Sort"
        >
          {SORTS.map((s) => (
            <option key={s.v} value={s.v}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {open && <FilterSheet close={() => setOpen(false)} apply={apply} sp={sp} />}
    </div>
  );
}

function Chip({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" data-active={active} onClick={onClick} className="chip">
      {children}
    </button>
  );
}

function FilterSheet({
  close,
  apply,
  sp,
}: {
  close: () => void;
  apply: (n: Record<string, string | undefined>) => void;
  sp: URLSearchParams;
}) {
  const [propertyType, setPropertyType] = useState(sp.get("propertyType") || "");
  const [city, setCity] = useState(sp.get("city") || "");
  const [minPrice, setMinPrice] = useState(sp.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(sp.get("maxPrice") || "");
  const [bedrooms, setBedrooms] = useState(sp.get("bedrooms") || "");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 md:items-center" onClick={close}>
      <div
        className="max-h-[86vh] w-full max-w-[560px] animate-sheetUp overflow-y-auto rounded-t-[24px] bg-app p-5 md:rounded-[24px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-[26px] text-ink">Filters</h2>
          <button onClick={close} className="grid h-10 w-10 place-items-center rounded-full bg-surface shadow-card">
            <X size={18} />
          </button>
        </div>

        <Section title="Property type">
          <div className="flex flex-wrap gap-2">
            <PillChoice active={!propertyType} onClick={() => setPropertyType("")}>Any</PillChoice>
            {PROPERTY_TYPES.map((t) => (
              <PillChoice key={t} active={propertyType === t} onClick={() => setPropertyType(t)}>
                {PROPERTY_TYPE_LABELS[t]}
              </PillChoice>
            ))}
          </div>
        </Section>

        <Section title="District / town">
          <select value={city} onChange={(e) => setCity(e.target.value)} className="field">
            <option value="">Anywhere in Iloilo</option>
            {ALL_AREAS.map((a) => (
              <option key={a.slug} value={a.name}>
                {a.name} {a.kind !== "district" ? `(${a.parent === "Iloilo City" ? "district" : "town"})` : ""}
              </option>
            ))}
          </select>
        </Section>

        <Section title="Budget (₱)">
          <div className="flex gap-3">
            <input inputMode="numeric" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Min" className="field" />
            <input inputMode="numeric" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Max" className="field" />
          </div>
        </Section>

        <Section title="Bedrooms">
          <div className="flex flex-wrap gap-2">
            <PillChoice active={!bedrooms} onClick={() => setBedrooms("")}>Any</PillChoice>
            {[1, 2, 3, 4, 5].map((n) => (
              <PillChoice key={n} active={bedrooms === String(n)} onClick={() => setBedrooms(String(n))}>
                {n}+
              </PillChoice>
            ))}
          </div>
        </Section>

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => {
              apply({ propertyType: undefined, city: undefined, minPrice: undefined, maxPrice: undefined, bedrooms: undefined });
              close();
            }}
            className="btn-ghost flex-1"
          >
            Reset
          </button>
          <button
            onClick={() => {
              apply({ propertyType: propertyType || undefined, city: city || undefined, minPrice: minPrice || undefined, maxPrice: maxPrice || undefined, bedrooms: bedrooms || undefined });
              close();
            }}
            className="btn-primary flex-1"
          >
            Show homes
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="mb-3 font-sans text-[13px] font-semibold text-muted">{title}</div>
      {children}
    </div>
  );
}
function PillChoice({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2.5 font-sans text-[13.5px] font-semibold transition-colors ${
        active ? "bg-ink text-white" : "bg-surface text-ink-2 shadow-card"
      }`}
    >
      {children}
    </button>
  );
}
