import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageTitle, Panel } from "@/components/dash/DashShell";
import { UnitImport } from "@/components/dev/UnitImport";
import { AddUnitForm } from "@/components/dev/AddUnitForm";
import { UnitFilterBar } from "@/components/dev/UnitFilterBar";
import { Pagination } from "@/components/app/Pagination";
import { unitCountsFor, unitInventory } from "@/lib/developer/queries";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, string> = {
  Available: "#6FB58F", Reserved: "#E2712B", Sold: "#95A79C", "On hold": "#D6A84F", "Under contract": "#D6A84F", Unavailable: "#95A79C",
};

export default async function ProjectUnitsPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: Record<string, string | undefined>;
}) {
  const user = await getSessionUser();
  if (!user?.developerId && user?.role !== "ADMIN") notFound();
  const project = await prisma.project.findFirst({
    where: { id: params.id, ...(user?.role === "ADMIN" ? {} : { developerId: user!.developerId! }) },
    include: { buildings: true },
  });
  if (!project) notFound();

  const counts = await unitCountsFor({ projectId: project.id });
  const { units, total, page, perPage } = await unitInventory(
    project.id,
    {
      building: searchParams.building,
      unitType: searchParams.unitType,
      status: searchParams.status,
      sort: searchParams.sort,
      page: searchParams.page ? Number(searchParams.page) : 1,
    },
    true, // developer sees agent info
  );
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div>
      <div className="mb-2">
        <Link href={`/developer/projects/${project.id}`} className="text-[12px] text-[#95A79C] hover:text-[#D6A84F]">← {project.name}</Link>
      </div>
      <PageTitle title="Unit inventory" subtitle={`${counts.total} total · ${counts.available} available · ${counts.reserved} reserved · ${counts.sold} sold`} />

      <div className="mb-6">
        <Panel title="Bulk import" action={<span className="text-[11px] text-[#95A79C]">CSV / JSON</span>}>
          <UnitImport projectId={project.id} />
        </Panel>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <UnitFilterBar buildings={project.buildings} />
        <AddUnitForm projectId={project.id} />
      </div>

      <Panel>
        {units.length === 0 ? (
          <p className="py-6 text-center text-[13.5px] text-[#95A79C]">No units match. Add units or import inventory above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-[#183A2B] text-[8.5px] font-semibold uppercase tracking-[0.16em] text-[#95A79C]">
                  <th className="py-3 pr-4">Unit</th>
                  <th className="py-3 pr-4">Building</th>
                  <th className="py-3 pr-4">Type</th>
                  <th className="py-3 pr-4">Area</th>
                  <th className="py-3 pr-4">Price</th>
                  <th className="py-3 pr-4">Agent price</th>
                  <th className="py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {units.map((u) => (
                  <tr key={u.id} className="border-b border-[#183A2B] text-[13.5px]">
                    <td className="py-3 pr-4 font-medium">{u.unitNumber}</td>
                    <td className="py-3 pr-4 text-[#95A79C]">{u.building || "—"}{u.floor != null ? ` · F${u.floor}` : ""}</td>
                    <td className="py-3 pr-4 text-[#95A79C]">{u.unitType}</td>
                    <td className="py-3 pr-4 tabular-nums text-[#95A79C]">{u.floorArea ? `${u.floorArea}m²` : "—"}</td>
                    <td className="py-3 pr-4 tabular-nums">{u.priceLabel}</td>
                    <td className="py-3 pr-4 tabular-nums text-[#D6A84F]">{u.agentPriceLabel || "—"}</td>
                    <td className="py-3">
                      <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: STATUS_TONE[u.status] || "#F4F0E6" }}>{u.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} totalPages={totalPages} />
      </Panel>
    </div>
  );
}
