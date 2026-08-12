import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatPeso } from "@/lib/format";
import { PROPERTY_TYPE_LABELS, PropertyType } from "@/lib/enums";
import { PageTitle, Panel } from "@/components/dash/DashShell";
import { setListingStatusAction } from "@/lib/dashboard-actions";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, string> = {
  ACTIVE: "#7E9877", PENDING_REVIEW: "#C9A227", DRAFT: "#8A8074", RESERVED: "#E2712B",
  SOLD: "#8A8074", RENTED: "#8A8074", REJECTED: "#C05B4A", EXPIRED: "#8A8074", ARCHIVED: "#8A8074",
};

export default async function DashboardListings({ searchParams }: { searchParams: { created?: string } }) {
  const user = await getSessionUser();
  if (!user?.agentId) return <PageTitle title="My Listings" subtitle="Sign in as a broker to manage listings." />;

  const listings = await prisma.listing.findMany({
    where: { agentId: user.agentId },
    include: { property: true, _count: { select: { views: true, savedBy: true, inquiries: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4">
        <PageTitle title="My Listings" subtitle={`${listings.length} total`} />
        <Link href="/dashboard/listings/new" className="mb-2 flex-none border border-[#C9A227] bg-[#C9A227] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#0B0A08]">
          + Add listing
        </Link>
      </div>

      {searchParams.created && (
        <div className="mb-5 border border-[#4C6046] bg-[#0E120E] px-4 py-3 text-[13px] text-[#7E9877]">
          Listing created — it's now pending admin review before going live.
        </div>
      )}

      <Panel>
        {listings.length === 0 ? (
          <p className="py-6 text-center text-[13.5px] text-[#8A8074]">No listings yet. Add your first one.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-[#1D1B16] text-[8.5px] font-semibold uppercase tracking-[0.16em] text-[#8A8074]">
                  <th className="py-3 pr-4">Listing</th>
                  <th className="py-3 pr-4">Type</th>
                  <th className="py-3 pr-4">Price</th>
                  <th className="py-3 pr-4">Views</th>
                  <th className="py-3 pr-4">Leads</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3">Mark as</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((l) => (
                  <tr key={l.id} className="border-b border-[#1D1B16] text-[13.5px]">
                    <td className="py-3 pr-4">
                      <Link href={`/property/${l.id}`} className="font-medium hover:text-[#C9A227]">{l.property.title}</Link>
                      <div className="text-[11.5px] text-[#8A8074]">{l.property.city}</div>
                    </td>
                    <td className="py-3 pr-4 text-[#8A8074]">{PROPERTY_TYPE_LABELS[l.property.propertyType as PropertyType]} · {l.listingType}</td>
                    <td className="py-3 pr-4 tabular-nums">{formatPeso(l.price)}</td>
                    <td className="py-3 pr-4 tabular-nums text-[#8A8074]">{l._count.views}</td>
                    <td className="py-3 pr-4 tabular-nums text-[#8A8074]">{l._count.inquiries}</td>
                    <td className="py-3 pr-4">
                      <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: STATUS_TONE[l.status] || "#F4F0E6" }}>
                        {l.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3">
                      <form action={setListingStatusAction} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={l.id} />
                        <select name="status" defaultValue={l.status} className="border border-[#33302A] bg-[#0B0A08] px-2 py-1.5 text-[12px] text-[#F4F0E6]">
                          {["ACTIVE", "RESERVED", "SOLD", "RENTED", "ARCHIVED"].map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <button className="border border-[#33302A] px-2.5 py-1.5 text-[11px] font-semibold hover:border-[#C9A227] hover:text-[#C9A227]">Save</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
