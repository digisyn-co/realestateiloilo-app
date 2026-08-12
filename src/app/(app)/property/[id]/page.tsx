import { notFound } from "next/navigation";
import Link from "next/link";
import { Sparkles, Check, MapPin } from "lucide-react";
import { getListingDetail, getSavedIds, similarListings } from "@/lib/queries";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatArea, formatPeso, pricePerSqm, initials } from "@/lib/format";
import { FRESHNESS_LABELS } from "@/lib/search";
import { Gallery } from "@/components/app/Gallery";
import { LeadActions } from "@/components/app/LeadActions";
import { StylisedMap } from "@/components/app/StylisedMap";
import { PropertyCard } from "@/components/PropertyCard";

export const dynamic = "force-dynamic";

export default async function PropertyPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { report?: string };
}) {
  const data = await getListingDetail(params.id);
  if (!data) notFound();
  const { listing, card, amenities } = data;
  const user = await getSessionUser();
  const savedIds = await getSavedIds(user?.id);

  // record a view (fire-and-forget)
  prisma.propertyView.create({ data: { listingId: listing.id, source: "web" } }).catch(() => {});

  const similar = await similarListings(card);
  const similarSaved = savedIds;
  const p = listing.property;
  const agent = listing.agent;

  const stats = [
    p.bedrooms != null && { value: p.bedrooms, label: "Bedrooms" },
    p.bathrooms != null && { value: p.bathrooms, label: "Bathrooms" },
    p.floorArea != null && { value: formatArea(p.floorArea), label: "Floor area" },
    p.lotArea != null && { value: formatArea(p.lotArea), label: "Lot area" },
    p.parking != null && { value: p.parking, label: "Parking" },
    { value: card.type, label: "Type" },
  ].filter(Boolean) as { value: React.ReactNode; label: string }[];

  const aiNotes = buildAiNotes(card, amenities);
  const perSqm = pricePerSqm(listing.price, p.floorArea || p.lotArea);

  return (
    <div className="mx-auto max-w-[860px] pb-8">
      <Gallery images={card.images} title={p.title} listingId={listing.id} initialSaved={savedIds.has(listing.id)} />

      <div className="grid gap-8 pt-6 md:grid-cols-[1fr_320px]">
        <div>
          <div className="serif-price text-[38px] leading-none text-ink">{card.priceLabel}</div>
          <h1 className="mt-2.5 font-serif text-[22px] leading-snug text-ink-2">{p.title}</h1>
          <div className="mt-2 flex items-center gap-1.5 font-sans text-[14.5px] text-muted">
            <MapPin size={15} /> {card.area}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {card.verified && (
              <span className="inline-flex items-center gap-2 rounded-full bg-success-soft px-3.5 py-2.5 font-sans text-[13px] font-semibold text-success">
                <span className="grid h-4 w-4 place-items-center rounded-full bg-success text-white">
                  <Check size={10} strokeWidth={3} />
                </span>
                {card.verified}
              </span>
            )}
            <span className="rounded-full bg-sand px-3.5 py-2.5 font-sans text-[13px] font-semibold text-ink-2">{card.saleRent}</span>
            <span className="rounded-full bg-sand px-3.5 py-2.5 font-sans text-[13px] font-semibold text-ink-2">{FRESHNESS_LABELS[card.freshnessCode as keyof typeof FRESHNESS_LABELS] || card.freshness}</span>
          </div>

          {/* stat tiles */}
          <div className="mt-6 flex flex-wrap gap-2">
            {stats.map((s, i) => (
              <div key={i} className="stat-tile min-w-[92px] flex-1">
                <div className="serif-price text-[22px] leading-none">{s.value}</div>
                <div className="mt-1.5 font-sans text-[11.5px] font-medium text-muted">{s.label}</div>
              </div>
            ))}
          </div>

          {/* about */}
          <Section title="About this home">
            <p className="whitespace-pre-line font-sans text-[15.5px] leading-[1.72] text-ink-3">{p.description}</p>
          </Section>

          {/* AI notes */}
          <div className="mt-7 rounded-xl2 bg-surface-warm p-5 shadow-card">
            <div className="mb-3.5 flex items-center gap-2.5">
              <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-accent text-white">
                <Sparkles size={14} />
              </span>
              <span className="font-sans text-[13px] font-semibold text-accent">What we noticed</span>
            </div>
            {aiNotes.map((n, i) => (
              <div key={i} className="flex items-baseline gap-3 py-2.5">
                <Check size={13} className="flex-none text-success" strokeWidth={3} />
                <span className="font-sans text-[14.5px] leading-relaxed text-ink-3">{n}</span>
              </div>
            ))}
            <div className="mt-3 border-t border-[#F3E7D9] pt-3.5 font-sans text-[12px] leading-relaxed text-muted-2">
              Written by AI from the listing details. Please confirm with the broker.
            </div>
          </div>

          {/* features */}
          {amenities.length > 0 && (
            <Section title="What's included">
              <div className="flex flex-wrap gap-2">
                {amenities.map((f) => (
                  <span key={f} className="rounded-full bg-surface px-3.5 py-2.5 font-sans text-[13.5px] font-medium text-ink-3 shadow-card">
                    {f}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* location */}
          <Section title="Where it is">
            <StylisedMap pins={[card]} height={220} showPreview={false} />
          </Section>

          {/* costs */}
          <Section title="Costs at a glance">
            <div className="grid gap-px overflow-hidden rounded-2xl bg-line-2">
              {costBreakdown(listing.price, listing.listingType).map((b) => (
                <div key={b.k} className="flex justify-between gap-3 bg-surface px-4 py-3.5">
                  <span className="font-sans text-[14px] text-muted">{b.k}</span>
                  <span className="font-sans text-[14px] font-semibold tabular-nums text-ink">{b.v}</span>
                </div>
              ))}
              {perSqm && (
                <div className="flex justify-between gap-3 bg-surface px-4 py-3.5">
                  <span className="font-sans text-[14px] text-muted">Price per sqm</span>
                  <span className="font-sans text-[14px] font-semibold tabular-nums text-ink">{perSqm}</span>
                </div>
              )}
            </div>
          </Section>

          {/* provenance / source attribution for imported listings */}
          {card.imported && (
            <div className="mt-6 rounded-2xl border border-line bg-app px-4 py-3.5 font-sans text-[13px] text-muted">
              Imported listing · Source: {card.sourceName || "external"}
              {listing.sourceUrl && (
                <>
                  {" · "}
                  <a href={listing.sourceUrl} target="_blank" rel="noreferrer" className="text-accent">
                    original
                  </a>
                </>
              )}
            </div>
          )}
        </div>

        {/* sticky sidebar: agent + actions */}
        <aside className="md:sticky md:top-[80px] md:self-start">
          {agent && (
            <Link href={`/broker/${agent.id}`} className="mb-4 flex items-center gap-3.5 rounded-xl2 bg-surface p-4 shadow-card">
              <div className="grid h-[52px] w-[52px] flex-none place-items-center rounded-full bg-ink font-sans text-[15px] font-bold text-white">
                {initials(agent.user.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-sans text-[15.5px] font-medium text-ink">{agent.user.name}</div>
                {agent.verified && <div className="font-sans text-[12.5px] font-semibold text-success">✓ Verified broker</div>}
                {agent.company && <div className="truncate font-sans text-[12px] text-muted">{agent.company}</div>}
              </div>
              <span className="flex-none text-accent">→</span>
            </Link>
          )}
          <LeadActions listingId={listing.id} agentName={agent?.user.name} openReport={searchParams.report === "1"} />
        </aside>
      </div>

      {/* similar */}
      {similar.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-4 font-serif text-[26px] text-ink">Similar homes</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {similar.slice(0, 3).map((s) => (
              <PropertyCard key={s.id} p={s} initialSaved={similarSaved.has(s.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-7">
      <h3 className="mb-3.5 font-serif text-[22px] text-ink">{title}</h3>
      {children}
    </div>
  );
}

function costBreakdown(price: number, listingType: string) {
  if (listingType === "RENT") {
    return [
      { k: "Monthly rent", v: formatPeso(price) },
      { k: "Advance (1 month)", v: formatPeso(price) },
      { k: "Deposit (2 months)", v: formatPeso(price * 2) },
      { k: "Move-in total", v: formatPeso(price * 3) },
    ];
  }
  const dp = price * 0.2;
  return [
    { k: "Asking price", v: formatPeso(price) },
    { k: "Suggested down (20%)", v: formatPeso(dp) },
    { k: "Est. transfer taxes", v: formatPeso(price * 0.065) },
    { k: "Est. balance to finance", v: formatPeso(price - dp) },
  ];
}

function buildAiNotes(card: { price: number; perSqm?: string; drop?: string; freshness: string; type: string }, amenities: string[]): string[] {
  const notes: string[] = [];
  if (card.perSqm) notes.push(`Priced at ${card.perSqm} — around the going rate for ${card.type.toLowerCase()}s in this area.`);
  if (card.drop) notes.push(`The price recently dropped (${card.drop}), so there may be room to negotiate.`);
  if (amenities.includes("Parking") || amenities.includes("Garage")) notes.push("Has dedicated parking, which is a plus for resale.");
  if (amenities.some((a) => a.startsWith("Near"))) notes.push("Close to schools and everyday amenities.");
  notes.push(`Listing freshness: ${card.freshness.toLowerCase()} — details were checked recently.`);
  return notes.slice(0, 4);
}
