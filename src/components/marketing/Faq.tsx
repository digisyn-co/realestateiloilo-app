"use client";

import { useState } from "react";

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="max-w-[840px]">
      {items.map((f, i) => (
        <div key={i} className="border-b border-[#1A3550]">
          <button
            onClick={() => setOpen(open === i ? -1 : i)}
            className="flex w-full items-baseline justify-between gap-5 py-6 text-left"
          >
            <span className="font-serif text-[19px] leading-snug md:text-[24px]" style={{ color: open === i ? "#C6A15C" : "#EDE7D6" }}>
              {f.q}
            </span>
            <span className="flex-none font-serif text-[22px] text-[#C6A15C]">{open === i ? "−" : "+"}</span>
          </button>
          {open === i && <p className="mb-6 max-w-[640px] font-sans text-[15px] leading-relaxed text-[#EDE7D6]/70">{f.a}</p>}
        </div>
      ))}
    </div>
  );
}
