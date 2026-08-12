"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Heart, Share2, X } from "lucide-react";
import { PropertyImage } from "../PropertyImage";

export function Gallery({
  images,
  title,
  listingId,
  initialSaved,
}: {
  images: string[];
  title: string;
  listingId: string;
  initialSaved: boolean;
}) {
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(initialSaved);
  const list = images.length ? images : [""];

  async function save() {
    const next = !saved;
    setSaved(next);
    const res = await fetch("/api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ listingId, save: next }) });
    if (res.status === 401) window.location.href = "/login?next=/property/" + listingId;
    else if (!res.ok) setSaved(!next);
  }
  function share() {
    const url = window.location.href;
    if (navigator.share) navigator.share({ title, url }).catch(() => {});
    else {
      navigator.clipboard?.writeText(url);
      alert("Link copied");
    }
  }

  return (
    <>
      <div className="relative h-[320px] overflow-hidden bg-line-2 md:h-[420px] md:rounded-xl2" onClick={() => setOpen(true)}>
        <PropertyImage src={list[idx]} alt={title} placeholder="Main photograph" />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-ink/35 to-transparent" />
        <div className="absolute left-3.5 right-3.5 top-3.5 flex items-center justify-between">
          <Link
            href="/browse"
            onClick={(e) => e.stopPropagation()}
            className="grid h-11 w-11 place-items-center rounded-full bg-white/95 text-ink shadow-float backdrop-blur"
          >
            <ChevronLeft size={20} />
          </Link>
          <div className="flex gap-2.5">
            <button onClick={(e) => { e.stopPropagation(); save(); }} className="grid h-11 w-11 place-items-center rounded-full bg-white/95 shadow-float backdrop-blur">
              <Heart size={18} className={saved ? "fill-accent text-accent" : "text-ink"} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); share(); }} className="grid h-11 w-11 place-items-center rounded-full bg-white/95 text-ink shadow-float backdrop-blur">
              <Share2 size={17} />
            </button>
          </div>
        </div>
        <div className="absolute bottom-3.5 right-3.5 rounded-full bg-ink/70 px-3.5 py-2 font-sans text-[12px] font-semibold text-white backdrop-blur">
          {idx + 1} / {list.length} photos
        </div>
      </div>

      {list.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto px-1 pt-3">
          {list.map((img, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`relative h-[72px] w-[104px] flex-none overflow-hidden rounded-[14px] bg-line-2 ${i === idx ? "ring-2 ring-accent" : ""}`}
            >
              <PropertyImage src={img} alt={`${title} ${i + 1}`} placeholder="" />
            </button>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/95 p-4" onClick={() => setOpen(false)}>
          <button className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white">
            <X size={20} />
          </button>
          <div className="max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-xl2" onClick={(e) => e.stopPropagation()}>
            <div className="relative aspect-[16/10]">
              <PropertyImage src={list[idx]} alt={title} placeholder="Photograph" />
            </div>
            {list.length > 1 && (
              <div className="mt-3 flex justify-center gap-2">
                {list.map((_, i) => (
                  <button key={i} onClick={() => setIdx(i)} className={`h-2 w-2 rounded-full ${i === idx ? "bg-white" : "bg-white/40"}`} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
