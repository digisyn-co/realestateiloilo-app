import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatPeso } from "@/lib/format";
import { PROPERTY_TYPE_LABELS, PropertyType } from "@/lib/enums";
import { PageTitle, Panel } from "@/components/dash/DashShell";
import { setListingStatusAction } from "@/lib/dashboard-actions";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, string> = {
  ACTIVE: "#6FB58F", PENDING_BROKER_REVIEW: "#D6A84F", PENDING_REVIEW: "#D6A84F", DRAFT: "#95A79C", RESERVED: "#E2712B",
  SOLD: "#95A79C", RENTED: "#95A79C", REJECTED: "#C05B4A", EXPIRED: "#95A79C", ARCHIVED: "#95A79C",
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
        <Link href="/dashboard/listings/new" className="mb-2 flex-none border border-[#D6A84F] bg-[#D6A84F] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#05120C]">
          + Add listing
        </Link>
      </div>

      {searchParams.created && (
        <div className="mb-5 border border-[#2E5A40] bg-[#0B241A] px-4 py-3 text-[13px] text-[#6FB58F]">
          Listing created — it's now pending admin review before going live.
        </div>
      )}

      <Panel>
        {listings.length === 0 ? (
          <p className="py-6 text-center text-[13.5px] text-[#95A79C]">No listings yet. Add your first one.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-[#183A2B] text-[8.5px] font-semibold uppercase tracking-[0.16em] text-[#95A79C]">
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
                  <tr key={l.id} className="border-b border-[#183A2B] text-[13.5px]">
                    <td className="py-3 pr-4">
                      <Link href={`/property/${l.id}`} className="font-medium hover:text-[#D6A84F]">{l.property.title}</Link>
                      <div className="text-[11.5px] text-[#95A79C]">{l.property.city}</div>
                    </td>
                    <td className="py-3 pr-4 text-[#95A79C]">{PROPERTY_TYPE_LABELS[l.property.propertyType as PropertyType]} · {l.listingType}</td>
                    <td className="py-3 pr-4 tabular-nums">{formatPeso(l.price)}</td>
                    <td className="py-3 pr-4 tabular-nums text-[#95A79C]">{l._count.views}</td>
                    <td className="py-3 pr-4 tabular-nums text-[#95A79C]">{l._count.inquiries}</td>
                    <td className="py-3 pr-4">
                      <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: STATUS_TONE[l.status] || "#F4F0E6" }}>
                        {l.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3">
                      <form action={setListingStatusAction} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={l.id} />
                        <select name="status" defaultValue={l.status} className="border border-[#245140] bg-[#05120C] px-2 py-1.5 text-[12px] text-[#F4F0E6]">
                          {["ACTIVE", "RESERVED", "SOLD", "RENTED", "ARCHIVED"].map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <button className="border border-[#245140] px-2.5 py-1.5 text-[11px] font-semibold hover:border-[#D6A84F] hover:text-[#D6A84F]">Save</button>
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
