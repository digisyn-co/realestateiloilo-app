import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatPeso, timeAgo } from "@/lib/format";
import { PROPERTY_TYPE_LABELS, PropertyType } from "@/lib/enums";
import { PageTitle, Panel } from "@/components/dash/DashShell";
import { resolveAgentListingAction } from "@/lib/dashboard-actions";

export const dynamic = "force-dynamic";

export default async function AgentListingReviewPage() {
  const user = await getSessionUser();
  if (user?.role !== "BROKER" && user?.role !== "ADMIN") return <PageTitle title="Agent Listings" subtitle="Only head brokers review agent listings." />;
  if (!user.agentId) return <PageTitle title="Agent Listings" subtitle="No brokerage profile." />;

  const pending = await prisma.listing.findMany({
    where: { agent: { headBrokerId: user.agentId }, status: "PENDING_BROKER_REVIEW" },
    include: { property: { include: { amenities: { include: { amenity: true } } } }, agent: { include: { user: true } }, images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <PageTitle title="Agent Listings" subtitle={`${pending.length} awaiting your approval. Once you approve, the listing is broker-verified and goes live.`} />

      {pending.length === 0 ? (
        <Panel><p className="py-6 text-center text-[13.5px] text-[#95A79C]">Nothing to review — your agents' listings are all handled.</p></Panel>
      ) : (
        <div className="grid gap-4">
          {pending.map((l) => {
            const p = l.property;
            const specs = [p.bedrooms && `${p.bedrooms} bed`, p.bathrooms && `${p.bathrooms} bath`, p.floorArea && `${p.floorArea} sqm`].filter(Boolean).join(" · ");
            return (
              <div key={l.id} className="border border-[#1A3550] bg-[#0A1B14]">
                <div className="flex flex-wrap items-start justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <Link href={`/property/${l.id}`} className="font-serif text-[20px] hover:text-[#D6A84F]">{p.title}</Link>
                    <div className="mt-1 text-[12.5px] text-[#95A79C]">
                      {formatPeso(l.price)} · {PROPERTY_TYPE_LABELS[p.propertyType as PropertyType]} · {p.city} · {specs || "—"}
                    </div>
                    <div className="mt-2 text-[12px] text-[#95A79C]">
                      Submitted by <span className="text-[#F4F0E6]">{l.agent?.user.name}</span> · {timeAgo(l.createdAt)}
                    </div>
                  </div>
                  {l.images[0]?.url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.images[0].url} alt={p.title} className="h-20 w-28 flex-none rounded-lg object-cover" />
                  )}
                </div>
                <form action={resolveAgentListingAction} className="flex flex-wrap items-center gap-2 border-t border-[#1A3550] px-5 py-4">
                  <input type="hidden" name="id" value={l.id} />
                  <input name="note" placeholder="Optional note to the agent…" className="dfield min-w-[200px] flex-1 py-2 text-[13px]" />
                  <button name="decision" value="APPROVE" className="border border-[#D6A84F] bg-[#D6A84F] px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#031A14]">Approve &amp; publish</button>
                  <button name="decision" value="REJECT" className="border border-[#245140] px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#95A79C] hover:border-[#C05B4A] hover:text-[#C05B4A]">Send back</button>
                </form>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
