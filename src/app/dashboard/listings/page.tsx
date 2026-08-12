import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatPeso } from "@/lib/format";
import { PROPERTY_TYPE_LABELS, PropertyType } from "@/lib/enums";
import { PageTitle, Panel } from "@/components/dash/DashShell";
import { setListingStatusAction } from "@/lib/dashboard-actions";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, string> = {
  ACTIVE: "#5FA39C", PENDING_REVIEW: "#C6A15C", DRAFT: "#8AA0B4", RESERVED: "#E2712B",
  SOLD: "#8AA0B4", RENTED: "#8AA0B4", REJECTED: "#C05B4A", EXPIRED: "#8AA0B4", ARCHIVED: "#8AA0B4",
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
        <Link href="/dashboard/listings/new" className="mb-2 flex-none border border-[#C6A15C] bg-[#C6A15C] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#0A1C33]">
          + Add listing
        </Link>
      </div>

      {searchParams.created && (
        <div className="mb-5 border border-[#2C5A54] bg-[#0C2A26] px-4 py-3 text-[13px] text-[#5FA39C]">
          Listing created — it's now pending admin review before going live.
        </div>
      )}

      <Panel>
        {listings.length === 0 ? (
          <p className="py-6 text-center text-[13.5px] text-[#8AA0B4]">No listings yet. Add your first one.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-[#1A3550] text-[8.5px] font-semibold uppercase tracking-[0.16em] text-[#8AA0B4]">
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
                  <tr key={l.id} className="border-b border-[#1A3550] text-[13.5px]">
                    <td className="py-3 pr-4">
                      <Link href={`/property/${l.id}`} className="font-medium hover:text-[#C6A15C]">{l.property.title}</Link>
                      <div className="text-[11.5px] text-[#8AA0B4]">{l.property.city}</div>
                    </td>
                    <td className="py-3 pr-4 text-[#8AA0B4]">{PROPERTY_TYPE_LABELS[l.property.propertyType as PropertyType]} · {l.listingType}</td>
                    <td className="py-3 pr-4 tabular-nums">{formatPeso(l.price)}</td>
                    <td className="py-3 pr-4 tabular-nums text-[#8AA0B4]">{l._count.views}</td>
                    <td className="py-3 pr-4 tabular-nums text-[#8AA0B4]">{l._count.inquiries}</td>
                    <td className="py-3 pr-4">
                      <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: STATUS_TONE[l.status] || "#EDE7D6" }}>
                        {l.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3">
                      <form action={setListingStatusAction} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={l.id} />
                        <select name="status" defaultValue={l.status} className="border border-[#274563] bg-[#0A1C33] px-2 py-1.5 text-[12px] text-[#EDE7D6]">
                          {["ACTIVE", "RESERVED", "SOLD", "RENTED", "ARCHIVED"].map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <button className="border border-[#274563] px-2.5 py-1.5 text-[11px] font-semibold hover:border-[#C6A15C] hover:text-[#C6A15C]">Save</button>
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
