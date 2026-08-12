import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { developerProjectCards } from "@/lib/developer/queries";
import { visibleProjectsWhere } from "@/lib/developer/access";
import { initials } from "@/lib/format";
import { ProjectCard } from "@/components/dev/ProjectCard";

export const dynamic = "force-dynamic";

export default async function DeveloperProfilePage({ params }: { params: { id: string } }) {
  const developer = await prisma.developer.findUnique({ where: { id: params.id }, include: { user: true } });
  if (!developer) notFound();
  const viewer = await getSessionUser();

  // only projects the viewer may see
  const all = await developerProjectCards(developer.id);
  const visibleIds = new Set(
    (await prisma.project.findMany({ where: { AND: [{ developerId: developer.id }, visibleProjectsWhere(viewer)] }, select: { id: true } })).map((p) => p.id),
  );
  const projects = all.filter((p) => visibleIds.has(p.id));
  const activeProjects = projects.filter((p) => !["COMPLETED", "SOLD_OUT", "ARCHIVED"].includes(p.statusCode)).length;

  return (
    <div className="mx-auto max-w-[900px] pt-4">
      <div className="rounded-xl2 bg-surface p-6 shadow-card">
        <div className="flex flex-wrap items-center gap-5">
          <div className="grid h-20 w-20 flex-none place-items-center rounded-2xl bg-ink font-sans text-[24px] font-bold text-white">
            {initials(developer.company)}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-serif text-[30px] leading-none text-ink">{developer.company}</h1>
            {developer.verified && <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1.5 font-sans text-[12.5px] font-semibold text-success">✓ Verified developer</div>}
          </div>
        </div>
        {developer.description && <p className="mt-5 font-sans text-[15px] leading-relaxed text-ink-3">{developer.description}</p>}
        <div className="mt-5 flex flex-wrap gap-2">
          <Stat value={projects.length} label="Projects" />
          <Stat value={activeProjects} label="Active projects" />
          {developer.yearsOperating && <Stat value={developer.yearsOperating} label="Years operating" />}
        </div>
        {developer.website && (
          <a href={developer.website} target="_blank" rel="noreferrer" className="mt-4 inline-block font-sans text-[13.5px] font-semibold text-accent">
            {developer.website.replace(/^https?:\/\//, "")} ↗
          </a>
        )}
      </div>

      <h2 className="mb-4 mt-8 font-serif text-[26px] text-ink">Projects</h2>
      {projects.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => <ProjectCard key={p.id} p={p} />)}
        </div>
      ) : (
        <p className="font-sans text-[14.5px] text-muted">No public projects yet.</p>
      )}
    </div>
  );
}

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="stat-tile min-w-[110px] flex-1 text-center">
      <div className="serif-price text-[24px] leading-none">{value}</div>
      <div className="mt-1.5 font-sans text-[11.5px] font-medium text-muted">{label}</div>
    </div>
  );
}
