import Link from "next/link";
import { prisma } from "@/lib/db";
import { toCard, districtCounts } from "@/lib/queries";
import { compactPeso } from "@/lib/format";
import { PropertyImage } from "@/components/PropertyImage";
import { Faq } from "@/components/marketing/Faq";
import { ILOILO_CITY_DISTRICTS } from "@/lib/iloilo";

export const dynamic = "force-dynamic";

// Marketing site — dark editorial theme, gold accent (Marketing Site.dc.html).
export default async function Home() {
  const [featuredRows, counts, totals] = await Promise.all([
    prisma.listing.findMany({
      where: { status: "ACTIVE", verificationStatus: "VERIFIED" },
      include: { property: { include: { amenities: { include: { amenity: true } } } }, images: { orderBy: { sortOrder: "asc" } }, agent: { include: { user: true } }, _count: { select: { savedBy: true, views: true } } },
      take: 4,
      orderBy: { publishedAt: "desc" },
    }),
    districtCounts(),
    Promise.all([prisma.listing.count({ where: { status: "ACTIVE" } }), prisma.agent.count({ where: { verified: true } })]),
  ]);
  const featured = featuredRows.map((l) => toCard(l as never));
  const [liveCount, brokerCount] = totals;

  const ranges: Record<string, string> = { Mandurriao: "₱2.4M – ₱22M", Jaro: "₱1.8M – ₱18M", Molo: "₱1.5M – ₱9M", "La Paz": "₱1.6M – ₱11M", Pavia: "₱900K – ₱6M", Oton: "₱1.1M – ₱7M" };
  const countMap = new Map(counts.map((c) => [c.name, c.count]));

  return (
    <div className="min-h-screen bg-[#0A1C33] font-sans text-[#EDE7D6]">
      {/* header */}
      <header className="sticky top-0 z-50 border-b border-[#1A3550] bg-[#0A1C33]/85 backdrop-blur">
        <div className="mx-auto flex h-[70px] max-w-[1360px] items-center gap-8 px-6">
          <div className="font-serif text-[24px] leading-none">
            The <span className="italic text-[#C6A15C]">Iloilo</span> Real Estate
          </div>
          <nav className="hidden items-center gap-7 md:flex">
            {[["How it works", "#how"], ["Verified", "#verified"], ["Districts", "#districts"], ["Pricing", "#pricing"], ["Careers", "#careers"]].map(([l, h]) => (
              <a key={l} href={h} className="text-[9.5px] font-semibold uppercase tracking-[0.17em] text-[#EDE7D6]/70 hover:text-[#C6A15C]">
                {l}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-stretch">
            <Link href="/register" className="hidden items-center border border-[#274563] px-4 text-[9.5px] font-semibold uppercase tracking-[0.16em] hover:border-[#C6A15C] hover:text-[#C6A15C] sm:flex">
              For brokers
            </Link>
            <Link href="/browse" className="flex items-center bg-[#C6A15C] px-5 py-2.5 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-[#0A1C33] hover:bg-[#EDE7D6]">
              Browse listings
            </Link>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="relative h-[86vh] min-h-[560px] overflow-hidden bg-[#0C2138]">
        <div className="absolute inset-0">
          <div className="absolute inset-0" style={{ filter: "brightness(.55) saturate(.7) contrast(1.14)" }}>
            <PropertyImage src="/property-images/a2.png" alt="Iloilo" placeholder="" />
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A1C33]/70 via-[#0A1C33]/20 to-[#0A1C33]" />
        <div className="relative mx-auto flex h-full max-w-[1360px] flex-col justify-end px-6 pb-16">
          <h1 className="font-serif text-[clamp(46px,9vw,120px)] leading-[.9] tracking-[-.035em]">
            Every property
            <br />
            in <span className="italic text-[#C6A15C]">Iloilo.</span> Verified.
          </h1>
          <p className="mt-6 max-w-[540px] text-[17px] leading-relaxed text-[#EDE7D6]/70">
            Homes, land, rentals and commercial property across the city and its neighbouring towns — every listing checked before it goes live.
          </p>
          <div className="mt-8 flex flex-wrap">
            <Link href="/browse" className="bg-[#C6A15C] px-7 py-4 text-[10px] font-bold uppercase tracking-[0.16em] text-[#0A1C33] hover:bg-[#EDE7D6]">
              Browse listings
            </Link>
            <Link href="/ai" className="border border-[#EDE7D6]/30 border-l-0 bg-[#0A1C33]/40 px-7 py-4 text-[10px] font-bold uppercase tracking-[0.16em] hover:border-[#C6A15C] hover:text-[#C6A15C]">
              ✦ Try AI search
            </Link>
          </div>
          <div className="mt-11 flex max-w-[860px] flex-wrap border-t border-[#EDE7D6]/15">
            {[[`${liveCount.toLocaleString()}`, "Live listings"], [`${brokerCount}`, "Verified brokers"], ["7", "City districts"]].map(([n, l]) => (
              <div key={l} className="flex-1 basis-[160px] pr-6 pt-5">
                <div className="font-serif text-[clamp(30px,3.6vw,44px)] leading-none tabular-nums">{n}</div>
                <div className="mt-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#8AA0B4]">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* how it works */}
      <Section id="how" title="How it works" note="Describe what you want in plain words. The app does the filtering.">
        <div className="grid gap-8 pt-6 md:grid-cols-3">
          {[
            { n: "01", t: "Describe what you want", b: "Type it the way you'd say it to a friend. Budget, district, bedrooms, parking — read out of one sentence." },
            { n: "02", t: "Compare what comes back", b: "Every listing shows price per square metre, lot and floor area, and how the price has moved." },
            { n: "03", t: "Book the viewing in-app", b: "Pick a date and time from the broker's open slots. Messages and confirmations stay in one thread." },
          ].map((s) => (
            <div key={s.n} className="border-t border-[#1A3550] pt-6">
              <div className="mb-3 flex items-baseline gap-4">
                <span className="font-serif text-[34px] text-[#C6A15C] tabular-nums">{s.n}</span>
                <h3 className="font-serif text-[25px]">{s.t}</h3>
              </div>
              <p className="text-[15px] leading-relaxed text-[#EDE7D6]/70">{s.b}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* why verified */}
      <Section id="verified" title="Why verified matters">
        <div className="grid gap-px bg-[#1A3550] md:grid-cols-4">
          {[
            { t: "Listings that don't exist", b: "Duplicated photos, prices from two years ago, properties sold months before. Buyers waste weekends on them." },
            { t: "We check the broker", b: "PRC licence and government ID matched against the account name before a single listing goes live." },
            { t: "We check the property", b: "Title numbers matched against the registry extract, and lot areas compared with the listing." },
            { t: "We check the photographs", b: "Images screened for watermarks and reuse from other agencies, and flagged when older than the listing." },
          ].map((v) => (
            <div key={v.t} className="bg-[#0A1C33] p-7">
              <h3 className="mb-3 font-serif text-[22px] leading-snug">{v.t}</h3>
              <p className="text-[14px] leading-relaxed text-[#EDE7D6]/68">{v.b}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* districts */}
      <Section id="districts" title="The districts" note="Seven districts and the neighbouring towns, each with its own character and price band.">
        <div className="grid grid-cols-2 gap-px bg-[#1A3550] md:grid-cols-4 lg:grid-cols-6">
          {ILOILO_CITY_DISTRICTS.map((d, i) => (
            <Link key={d.slug} href={`/browse?city=${encodeURIComponent(d.name)}`} className="group relative aspect-[3/4] overflow-hidden bg-[#0C2138]">
              <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105" style={{ filter: "brightness(.62) saturate(.6)" }}>
                <PropertyImage src={`/property-images/b${(i % 6) + 1}.png`} alt={d.name} placeholder={d.name} />
              </div>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0A1C33]/95" />
              <div className="absolute inset-x-4 bottom-4">
                <div className="mb-2 text-[9px] font-semibold uppercase tracking-[0.24em] text-[#C6A15C]">No. 0{i + 1}</div>
                <div className="font-serif text-[24px] leading-none">{d.name}</div>
                <div className="mt-2 text-[9px] font-semibold uppercase tracking-[0.15em] text-[#EDE7D6]/60">
                  {countMap.get(d.name) || 0} live · {ranges[d.name] || "—"}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {/* featured */}
      {featured.length > 0 && (
        <Section id="featured" title="Fresh on the register" note="A sample of verified homes live right now.">
          <div className="grid gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p) => (
              <Link key={p.id} href={`/property/${p.id}`} className="group block overflow-hidden rounded-card bg-[#0D2540] ring-1 ring-[#1A3550]">
                <div className="relative aspect-[16/11] overflow-hidden bg-[#0C2138]">
                  <div className="transition-transform duration-700 group-hover:scale-105 h-full w-full">
                    <PropertyImage src={p.img} alt={p.title} placeholder={p.type} />
                  </div>
                </div>
                <div className="p-4">
                  <div className="font-serif text-[24px] leading-none">{p.priceLabel}</div>
                  <div className="mt-2 text-[13.5px] font-medium text-[#EDE7D6]/85">{p.title}</div>
                  <div className="mt-1 text-[12px] text-[#8AA0B4]">{p.area}</div>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* pricing */}
      <Section id="pricing" title="Broker pricing" note="Buyers never pay. Verification is always free.">
        <div className="grid gap-px bg-[#1A3550] md:grid-cols-3">
          {[
            { name: "Starter", price: "₱1,490", per: "per month", featured: false, features: ["Up to 8 active listings", "Verified badge once approved", "Lead inbox", "Basic listing analytics"] },
            { name: "Pro Broker", price: "₱2,490", per: "per month", featured: true, features: ["Up to 25 active listings", "4 boosts a month", "AI listing descriptions", "Full analytics & enquiry sources", "Priority support"] },
            { name: "Developer", price: "From ₱12,000", per: "per month", featured: false, features: ["Unlimited units across projects", "Bulk CSV upload & sync", "Project pages with live availability", "Dedicated account manager"] },
          ].map((p) => (
            <div key={p.name} className={`p-8 ${p.featured ? "bg-[#0D2540] border-t-2 border-[#C6A15C]" : "bg-[#0A1C33]"}`}>
              {p.featured && <div className="mb-5 inline-block bg-[#C6A15C] px-3.5 py-2 text-[8.5px] font-bold uppercase tracking-[0.2em] text-[#0A1C33]">Most popular</div>}
              <div className="mb-4 text-[9px] font-semibold uppercase tracking-[0.22em] text-[#C6A15C]">{p.name}</div>
              <div className="font-serif text-[clamp(34px,3.8vw,46px)] leading-none tabular-nums">{p.price}</div>
              <div className="mb-6 mt-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#5E7488]">{p.per}</div>
              <div className="border-t border-[#1F3E5A]">
                {p.features.map((f) => (
                  <div key={f} className="flex items-baseline gap-3 border-b border-[#1A3550] py-3">
                    <span className="text-[10px] text-[#C6A15C]">✓</span>
                    <span className="text-[13.5px] text-[#EDE7D6]/78">{f}</span>
                  </div>
                ))}
              </div>
              <Link href="/register" className={`mt-6 block w-full py-4 text-center text-[9.5px] font-bold uppercase tracking-[0.16em] ${p.featured ? "bg-[#C6A15C] text-[#0A1C33]" : "border border-[#C6A15C] text-[#C6A15C]"}`}>
                {p.name === "Developer" ? "Talk to us" : "Apply now"}
              </Link>
            </div>
          ))}
        </div>
      </Section>

      {/* faq */}
      <Section id="faq" title="Questions">
        <Faq
          items={[
            { q: "Is the app free for buyers and renters?", a: "Yes. Searching, saving, comparing and messaging brokers is free. You don't need an account to search — only to save listings or send an enquiry." },
            { q: "What does “verified” actually mean?", a: "For brokers, we check the PRC licence and a government ID against the name on the account. For listings, we match the title number against the registry extract and confirm the photographs correspond to the property." },
            { q: "How does the AI search work?", a: "You describe what you want in plain words — “3-bedroom house under ₱5 million near Mandurriao with parking”. The app reads the budget, location, size and features out of that sentence and ranks matches by fit." },
            { q: "Do you handle the sale or take a commission?", a: "No. We are a register and a discovery tool. You deal directly with the broker or owner, and the commission arrangement stays between them and the seller." },
            { q: "Can I list my own property without a broker?", a: "Yes. Owner listings are allowed and go through the same title check. They carry a “Verified Owner” badge rather than a broker badge." },
            { q: "Which areas are covered?", a: "The districts of Iloilo City plus the neighbouring towns of Pavia, Oton, Santa Barbara and Leganes. More of Western Visayas is being added." },
          ]}
        />
      </Section>

      {/* careers anchor + footer */}
      <section id="careers" className="mx-auto max-w-[1360px] px-6 pt-20">
        <div className="border-b border-[#C6A15C] pb-6">
          <h2 className="font-serif text-[clamp(32px,4.6vw,54px)] tracking-[-.03em]">Careers</h2>
        </div>
        <div>
          {["Senior Mobile Engineer", "Trust & Safety Associate", "Broker Success Manager", "Product Designer", "Field Photographer"].map((r) => (
            <div key={r} className="flex items-center gap-5 border-b border-[#1A3550] py-5">
              <div className="flex-1 font-serif text-[24px]">{r}</div>
              <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8AA0B4]">Iloilo City / Remote</span>
              <span className="font-serif text-[20px] text-[#C6A15C]">→</span>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-20 border-t border-[#1A3550]">
        <div className="mx-auto flex max-w-[1360px] flex-wrap gap-11 px-6 py-12">
          <div className="flex-1 basis-[280px]">
            <div className="mb-3 font-serif text-[24px]">
              The <span className="italic text-[#C6A15C]">Iloilo</span> Real Estate
            </div>
            <p className="max-w-[300px] text-[13px] leading-relaxed text-[#5E7488]">The property register for Iloilo City and Western Visayas. Every listing checked before it goes live.</p>
          </div>
          {[
            { t: "Buyers", links: [["How it works", "#how"], ["Why verified", "#verified"], ["Districts", "#districts"], ["Browse", "/browse"]] },
            { t: "Brokers", links: [["Apply to list", "/register"], ["Pricing", "#pricing"], ["Dashboard", "/dashboard"]] },
            { t: "Company", links: [["Careers", "#careers"], ["Sign in", "/login"], ["Admin", "/admin"]] },
          ].map((c) => (
            <div key={c.t} className="basis-[170px]">
              <div className="mb-4 text-[8.5px] font-semibold uppercase tracking-[0.2em] text-[#C6A15C]">{c.t}</div>
              {c.links.map(([l, h]) => (
                <div key={l} className="py-1.5">
                  <Link href={h} className="text-[13px] text-[#8AA0B4] hover:text-[#C6A15C]">
                    {l}
                  </Link>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="mx-auto flex max-w-[1360px] flex-wrap justify-between gap-4 border-t border-[#1A3550] px-6 py-6">
          <span className="text-[8.5px] font-semibold uppercase tracking-[0.18em] text-[#46617A]">© 2026 The Iloilo Real Estate · Western Visayas, Philippines</span>
          <span className="text-[8.5px] font-semibold uppercase tracking-[0.18em] text-[#46617A]">Sample site · Demonstration content</span>
        </div>
      </footer>
    </div>
  );
}

function Section({ id, title, note, children }: { id?: string; title: string; note?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mx-auto max-w-[1360px] px-6 pt-20">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#C6A15C] pb-6">
        <h2 className="font-serif text-[clamp(32px,4.6vw,54px)] leading-none tracking-[-.03em]">{title}</h2>
        {note && <span className="max-w-[340px] text-right text-[13.5px] leading-relaxed text-[#8AA0B4]">{note}</span>}
      </div>
      {children}
    </section>
  );
}
