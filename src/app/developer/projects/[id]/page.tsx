import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatPeso } from "@/lib/format";
import { PROJECT_TYPE_LABELS, ProjectType, PROJECT_STATUS_LABELS, ProjectStatus } from "@/lib/enums";
import { Kpi, PageTitle, Panel } from "@/components/dash/DashShell";
import { ProjectSettingsForm } from "@/components/dev/ProjectSettingsForm";
import { unitCountsFor } from "@/lib/developer/queries";

export const dynamic = "force-dynamic";

export default async function DeveloperProjectDetail({ params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user?.developerId && user?.role !== "ADMIN") notFound();

  const project = await prisma.project.findFirst({
    where: { id: params.id, ...(user?.role === "ADMIN" ? {} : { developerId: user!.developerId! }) },
    include: { buildings: { include: { _count: { select: { units: true } } } }, images: { orderBy: { sortOrder: "asc" }, take: 1 } },
  });
  if (!project) notFound();
  const counts = await unitCountsFor({ projectId: project.id });
  const value = await prisma.unit.aggregate({ where: { projectId: project.id }, _sum: { price: true } });

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <Link href="/developer/projects" className="text-[12px] text-[#95A79C] hover:text-[#D6A84F]">← Projects</Link>
        <span className="rounded-full bg-[#0E241B] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wide text-[#D6A84F]">{PROJECT_STATUS_LABELS[project.status as ProjectStatus]}</span>
      </div>
      <PageTitle title={project.name} subtitle={`${PROJECT_TYPE_LABELS[project.projectType as ProjectType]} · ${project.barangay ? project.barangay + ", " : ""}${project.city}`} />

      <div className="mb-6 flex flex-wrap gap-2">
        <Link href={`/developer/projects/${project.id}/units`} className="border border-[#D6A84F] bg-[#D6A84F] px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#05120C]">Manage units</Link>
        <Link href={`/project/${project.slug}`} className="border border-[#245140] px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] hover:border-[#D6A84F] hover:text-[#D6A84F]">View public page ↗</Link>
        <Link href="/developer/agents" className="border border-[#245140] px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] hover:border-[#D6A84F] hover:text-[#D6A84F]">Agents</Link>
      </div>

      <div className="grid grid-cols-2 gap-px bg-[#183A2B] md:grid-cols-4">
        <Kpi value={counts.total} label="Total units" tone="gold" />
        <Kpi value={counts.available} label="Available" tone="green" />
        <Kpi value={counts.reserved} label="Reserved" tone="orange" />
        <Kpi value={counts.sold} label="Sold" />
        <Kpi value={formatPeso(value._sum.price || 0, { compact: true })} label="Inventory value" tone="gold" />
        <Kpi value={project.buildings.length} label="Buildings" />
        <Kpi value={project.visibility.replace("_", " ").toLowerCase()} label="Visibility" />
        <Kpi value={project.distribution.replace(/_/g, " ").toLowerCase()} label="Distribution" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Distribution & visibility settings">
          <ProjectSettingsForm project={project} />
        </Panel>

        <Panel title="Buildings" action={<span className="text-[12px] text-[#95A79C]">{project.buildings.length}</span>}>
          {project.buildings.length > 0 ? (
            <div className="divide-y divide-[#183A2B]">
              {project.buildings.map((b) => (
                <div key={b.id} className="flex items-center justify-between py-2.5 text-[13.5px]">
                  <span>{b.name}{b.floors ? ` · ${b.floors} floors` : ""}</span>
                  <span className="text-[#95A79C]">{b._count.units} units</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-[#95A79C]">No buildings yet. Buildings are created automatically when you add units with a building name (single-tower projects can skip this).</p>
          )}
        </Panel>
      </div>
    </div>
  );
}
