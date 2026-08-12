"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, Check, MoreHorizontal, ArrowDownRight } from "lucide-react";
import { CardModel } from "@/lib/queries";
import { PropertyImage } from "./PropertyImage";
import { addToCompare } from "@/lib/compare";

/**
 * The reusable premium property card (brief §8), transcribed from AppCard.dc.html.
 * Image → price → location → key stats → agent, verified badge, save, ··· menu.
 */
export function PropertyCard({ p, initialSaved = false }: { p: CardModel; initialSaved?: boolean }) {
  const [saved, setSaved] = useState(initialSaved);
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function toggleSave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    const next = !saved;
    setSaved(next);
    try {
      const res = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: p.id, save: next }),
      });
      if (res.status === 401) {
        window.location.href = "/login?next=" + encodeURIComponent(window.location.pathname);
        return;
      }
      if (!res.ok) setSaved(!next);
    } catch {
      setSaved(!next);
    } finally {
      setBusy(false);
    }
  }

  function menu(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen((v) => !v);
  }

  return (
    <Link
      href={`/property/${p.id}`}
      className="group relative flex flex-col overflow-hidden rounded-card bg-surface shadow-elev transition-all duration-300 hover:-translate-y-[3px] hover:shadow-card-hover"
    >
      <div className="relative aspect-[16/11] flex-none overflow-hidden bg-line-2">
        <div className="absolute inset-0 transition-transform duration-[1000ms] ease-[cubic-bezier(.16,.84,.28,1)] group-hover:scale-[1.06]">
          <PropertyImage src={p.img} alt={p.title} placeholder={p.type} />
        </div>
        <div className="absolute left-3 top-3 flex gap-1.5">
          <span className="pill bg-white/95 text-ink-2 backdrop-blur">{p.type}</span>
          {p.drop && (
            <span className="pill bg-accent text-white">
              <ArrowDownRight size={12} strokeWidth={2.5} />
              {p.drop.replace("↓ ", "")}
            </span>
          )}
          {p.imported && <span className="pill bg-ink/80 text-white">Imported</span>}
        </div>
        <button
          onClick={toggleSave}
          aria-label={saved ? "Remove from saved" : "Save"}
          className="absolute right-2.5 top-2.5 grid h-[42px] w-[42px] place-items-center rounded-full bg-white/95 shadow-float backdrop-blur transition-transform hover:scale-110"
        >
          <Heart size={18} className={saved ? "fill-accent text-accent" : "text-ink-2"} />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4 pb-[18px]">
        <div className="flex flex-wrap items-baseline gap-2.5">
          <span className="serif-price text-[27px] leading-none text-ink">{p.priceLabel}</span>
          {p.wasLabel && <span className="font-sans text-[13px] font-medium text-muted-2 line-through">{p.wasLabel}</span>}
        </div>
        <div className="font-sans text-[15.5px] font-medium leading-snug text-ink-2">{p.title}</div>
        <div className="font-sans text-[13.5px] text-muted">{p.area}</div>
        {p.specChips.length > 0 && (
          <div className="mt-0.5 flex flex-wrap gap-1.5">
            {p.specChips.map((c) => (
              <span key={c} className="rounded-full bg-sand px-2.5 py-[7px] font-sans text-[12.5px] font-medium text-ink-3">
                {c}
              </span>
            ))}
          </div>
        )}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2.5 pt-3.5">
          {p.verified ? (
            <span className="inline-flex items-center gap-1.5 font-sans text-[12.5px] font-semibold text-success">
              <span className="grid h-4 w-4 place-items-center rounded-full bg-success text-[9px] text-white">
                <Check size={10} strokeWidth={3} />
              </span>
              {p.verified}
            </span>
          ) : (
            <span className="font-sans text-[12px] text-muted-2">{p.saleRent}</span>
          )}
          {p.perSqm && <span className="font-sans text-[12.5px] tabular-nums text-muted-2">{p.perSqm}</span>}
        </div>
      </div>

      <button
        onClick={menu}
        aria-label="More"
        className="absolute bottom-3.5 right-3 grid h-[30px] w-[30px] place-items-center rounded-full bg-sand text-muted transition-colors hover:bg-ink hover:text-white"
      >
        <MoreHorizontal size={16} />
      </button>
      {menuOpen && (
        <div
          className="absolute bottom-[50px] right-3 z-10 min-w-[172px] overflow-hidden rounded-[14px] bg-white shadow-pop"
          onClick={(e) => e.preventDefault()}
        >
          <MenuItem onClick={() => share(p)}>Share</MenuItem>
          <MenuItem
            border
            onClick={() => {
              addToCompare(p.id);
              setMenuOpen(false);
            }}
          >
            Add to compare
          </MenuItem>
          <MenuItem border muted onClick={() => (window.location.href = `/property/${p.id}?report=1`)}>
            Report listing
          </MenuItem>
        </div>
      )}
    </Link>
  );
}

function MenuItem({
  children,
  onClick,
  border,
  muted,
}: {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  border?: boolean;
  muted?: boolean;
}) {
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick(e);
      }}
      className={`block min-h-[48px] w-full px-4 py-3.5 text-left font-sans text-[14px] font-medium hover:bg-app ${
        muted ? "text-muted" : "text-ink-2"
      } ${border ? "border-t border-line-2" : ""}`}
    >
      {children}
    </button>
  );
}

function share(p: CardModel) {
  const url = `${window.location.origin}/property/${p.id}`;
  if (navigator.share) navigator.share({ title: p.title, url }).catch(() => {});
  else {
    navigator.clipboard?.writeText(url);
    alert("Link copied to clipboard");
  }
}
