import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { developerProjectCards } from "@/lib/developer/queries";
import { VISIBILITY_LABELS, Visibility } from "@/lib/enums";
import { PageTitle, Panel } from "@/components/dash/DashShell";

export const dynamic = "force-dynamic";

export default async function DeveloperProjects() {
  const user = await getSessionUser();
  if (!user?.developerId) return <PageTitle title="Projects" subtitle="No developer profile." />;
  const projects = await developerProjectCards(user.developerId);

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4">
        <PageTitle title="Projects" subtitle={`${projects.length} project${projects.length === 1 ? "" : "s"}`} />
        <Link href="/developer/projects/new" className="mb-2 flex-none border border-[#D6A84F] bg-[#D6A84F] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#05120C]">+ New project</Link>
      </div>

      {projects.length === 0 ? (
        <Panel><p className="py-6 text-center text-[13.5px] text-[#95A79C]">No projects yet. Create your first development.</p></Panel>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (
            <Link key={p.id} href={`/developer/projects/${p.id}`} className="border border-[#183A2B] bg-[#0C2018] transition-colors hover:border-[#245140]">
              <div className="relative aspect-[16/9] overflow-hidden bg-[#0A1B14]">
                {p.img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.img} alt={p.name} className="h-full w-full object-cover opacity-80" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-[10px] uppercase tracking-widest text-[#4A6353]">No image</div>
                )}
                <span className="absolute left-3 top-3 rounded-full bg-[#05120C]/80 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wide text-[#D6A84F]">{p.status}</span>
                {p.visibility !== "PUBLIC" && (
                  <span className="absolute right-3 top-3 rounded-full bg-[#E2712B]/20 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wide text-[#E2712B]">{VISIBILITY_LABELS[p.visibility as Visibility]}</span>
                )}
              </div>
              <div className="p-4">
                <div className="font-serif text-[20px]">{p.name}</div>
                <div className="mt-1 text-[12px] text-[#95A79C]">{p.area} · {p.projectType}</div>
                <div className="mt-3 flex items-center justify-between border-t border-[#183A2B] pt-3 text-[12px]">
                  <span className="text-[#95A79C]">{p.totalUnits} units · <span className="text-[#6FB58F]">{p.availableUnits} available</span></span>
                  {p.priceFromLabel && <span className="font-serif text-[16px] text-[#D6A84F]">from {p.priceFromLabel}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
