"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { CardModel } from "@/lib/queries";
import { PropertyCard } from "@/components/PropertyCard";

const SUGGESTIONS = [
  "A 3-bedroom house under ₱5 million near Mandurriao with parking",
  "Condo for rent under ₱30,000 near Megaworld",
  "Residential lot in Pavia under ₱3M",
  "Commercial property in Mandurriao",
  "House for rent in Jaro with 2 bedrooms",
];

type Criteria = { label: string; kind: string };

export default function AiSearchPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"idle" | "thinking" | "done">("idle");
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [items, setItems] = useState<CardModel[]>([]);
  const [href, setHref] = useState("/browse");
  const [total, setTotal] = useState(0);

  async function run(q: string) {
    if (!q.trim()) return;
    setQuery(q);
    setStatus("thinking");
    const res = await fetch("/api/ai-search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: q }) });
    const data = await res.json();
    setCriteria(data.criteria || []);
    setItems(data.items || []);
    setHref(data.href || "/browse");
    setTotal(data.total || 0);
    setStatus("done");
  }

  return (
    <div className="mx-auto max-w-[860px] pt-4">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles size={18} className="text-accent" />
        <h1 className="font-serif text-[30px] leading-tight text-ink">Ask AI</h1>
      </div>
      <p className="mb-5 font-sans text-[14.5px] text-muted">Describe the home you want in your own words — we'll read the budget, location, size and features out of it.</p>

      <div className="rounded-xl2 bg-surface p-5 shadow-card">
        <div className="mb-3 flex items-center gap-2.5">
          <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-accent-soft text-accent">
            <Sparkles size={14} />
          </span>
          <span className="font-sans text-[13px] font-semibold text-accent">Tell us what you want</span>
        </div>
        <textarea
          rows={3}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="A 3-bedroom house under ₱5 million near Mandurriao with parking"
          className="w-full resize-none border-none bg-transparent font-serif text-[19px] leading-[1.44] text-ink outline-none"
        />
        <button onClick={() => run(query)} className="btn-primary mt-3 w-full">
          Find homes
        </button>
      </div>

      {status === "idle" && (
        <div className="pt-6">
          <div className="mb-3 font-sans text-[13px] font-semibold text-muted">Or try one of these</div>
          <div className="grid gap-2.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => run(s)}
                className="flex min-h-[56px] items-center gap-3 rounded-2xl bg-surface p-4 text-left font-serif text-[15px] text-ink-2 shadow-card"
              >
                <span className="flex-1">{s}</span>
                <ArrowRight size={16} className="flex-none text-accent" />
              </button>
            ))}
          </div>
        </div>
      )}

      {status !== "idle" && criteria.length > 0 && (
        <div className="pt-6">
          <div className="mb-3 font-sans text-[13px] font-semibold text-muted">Looking for</div>
          <div className="flex flex-wrap gap-2">
            {criteria.map((c, i) => (
              <span key={i} className="rounded-full bg-accent-soft px-3.5 py-2 font-sans text-[13px] font-semibold text-accent">
                {c.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {status === "thinking" && (
        <div className="grid gap-3 pt-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="animate-shim overflow-hidden rounded-card bg-surface shadow-card">
              <div className="aspect-[16/11] bg-line-2" />
              <div className="grid gap-3 p-4">
                <div className="h-4 w-1/2 rounded bg-line-2" />
                <div className="h-3 w-3/4 rounded bg-sand" />
              </div>
            </div>
          ))}
        </div>
      )}

      {status === "done" && (
        <div className="pt-6">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-serif text-[22px] text-ink">{total} matches</h2>
            {total > items.length && (
              <Link href={href} className="font-sans text-[13px] font-semibold text-accent">
                See all →
              </Link>
            )}
          </div>
          {items.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((p) => (
                <PropertyCard key={p.id} p={p} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl2 bg-surface p-10 text-center shadow-card">
              <div className="mb-2 font-serif text-[24px] text-ink">Nothing matched exactly.</div>
              <p className="font-sans text-[14px] text-muted">Try widening the budget or looking at nearby districts.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
