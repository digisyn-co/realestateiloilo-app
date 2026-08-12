import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { toCard, getSavedIds } from "@/lib/queries";
import { getSessionUser } from "@/lib/auth";
import { initials } from "@/lib/format";
import { PropertyImage } from "@/components/PropertyImage";
import { PropertyCard } from "@/components/PropertyCard";
import { Tabs } from "@/components/app/Tabs";

export const dynamic = "force-dynamic";

const listingInclude = {
  property: { include: { amenities: { include: { amenity: true } } } },
  images: { orderBy: { sortOrder: "asc" as const } },
  agent: { include: { user: true } },
  _count: { select: { savedBy: true, views: true } },
};

export default async function BrokerPage({ params }: { params: { id: string } }) {
  const agent = await prisma.agent.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      reviews: { orderBy: { createdAt: "desc" } },
      listings: { where: { status: { in: ["ACTIVE", "RESERVED"] } }, include: listingInclude },
    },
  });
  if (!agent) notFound();
  const user = await getSessionUser();
  const savedIds = await getSavedIds(user?.id);

  const cards = agent.listings.map((l) => toCard(l as never));
  const avgRating = agent.reviews.length ? (agent.reviews.reduce((s, r) => s + r.rating, 0) / agent.reviews.length).toFixed(1) : "—";
  const stats = [
    { value: cards.length, label: "Active listings" },
    { value: agent.reviews.length, label: "Reviews" },
    { value: avgRating, label: "Avg rating" },
    { value: agent.responseTime || "2h", label: "Replies in" },
  ];

  const creds = [
    agent.licenseNumber && { k: "PRC licence", v: `#${agent.licenseNumber}` },
    agent.company && { k: "Brokerage", v: agent.company },
    { k: "Coverage", v: "Iloilo City & province" },
    { k: "Verification", v: agent.verified ? "Verified" : "Pending" },
  ].filter(Boolean) as { k: string; v: string }[];

  return (
    <div className="mx-auto max-w-[860px] pt-2">
      <div className="relative h-[150px] overflow-hidden rounded-xl2 bg-line-2">
        <PropertyImage src="/property-images/b6.png" alt="Cover" placeholder="Cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/5 to-ink/50" />
      </div>
      <div className="-mt-8 px-2">
        <div className="flex items-end gap-4">
          <div className="grid h-[78px] w-[78px] flex-none place-items-center rounded-full border-[3px] border-app bg-ink font-sans text-[22px] font-bold text-white">
            {initials(agent.user.name)}
          </div>
          <div className="min-w-0 pb-1.5">
            <h1 className="font-serif text-[25px] leading-none text-ink">{agent.user.name}</h1>
            {agent.verified && <div className="mt-1.5 font-sans text-[12.5px] font-semibold text-success">✓ Verified broker</div>}
          </div>
        </div>
        <div className="mt-3 font-sans text-[13px] text-muted">
          Iloilo City{agent.licenseNumber ? ` · PRC #${agent.licenseNumber}` : ""} · Replies in {agent.responseTime || "about 2 hours"}
        </div>
      </div>

      <div className="mt-4 flex gap-2 px-2">
        <Link href="/messages" className="btn-primary flex-1">Message</Link>
        <Link href={cards[0] ? `/property/${cards[0].id}` : "#"} className="btn-ghost flex-1">View listings</Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 px-2">
        {stats.map((s) => (
          <div key={s.label} className="stat-tile flex-1 basis-[22%] text-center">
            <div className="serif-price text-[22px] leading-none">{s.value}</div>
            <div className="mt-1.5 font-sans text-[11px] font-medium text-muted">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 px-2">
        <Tabs
          tabs={[
            {
              label: "About",
              content: (
                <div>
                  {agent.bio && <p className="mb-5 font-sans text-[15px] leading-[1.74] text-ink-3">{agent.bio}</p>}
                  <div className="grid gap-px overflow-hidden rounded-2xl bg-line-2">
                    {creds.map((c) => (
                      <div key={c.k} className="flex flex-wrap justify-between gap-3 bg-surface px-4 py-3.5">
                        <span className="font-sans text-[14px] text-muted">{c.k}</span>
                        <span className="font-sans text-[13.5px] font-semibold text-ink">{c.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ),
            },
            {
              label: `Listings (${cards.length})`,
              content:
                cards.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {cards.map((p) => (
                      <PropertyCard key={p.id} p={p} initialSaved={savedIds.has(p.id)} />
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center font-sans text-muted">No active listings.</p>
                ),
            },
            {
              label: `Reviews (${agent.reviews.length})`,
              content:
                agent.reviews.length > 0 ? (
                  <div className="grid gap-3">
                    {agent.reviews.map((r) => (
                      <div key={r.id} className="rounded-xl2 bg-surface p-4 shadow-card">
                        <div className="mb-2 flex justify-between">
                          <span className="font-sans text-[14px] font-semibold text-ink">{r.authorName}</span>
                          <span className="font-sans text-[13px] font-semibold text-accent">{"★".repeat(r.rating)}</span>
                        </div>
                        <p className="font-sans text-[14.5px] leading-relaxed text-ink-3">{r.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center font-sans text-muted">No reviews yet.</p>
                ),
            },
          ]}
        />
      </div>
    </div>
  );
}
