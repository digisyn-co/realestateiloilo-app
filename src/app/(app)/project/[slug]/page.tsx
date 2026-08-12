import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Check, Sparkles, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { canViewProject } from "@/lib/developer/access";
import { projectDetail, unitInventory } from "@/lib/developer/queries";
import { PROJECT_TYPE_LABELS, ProjectType, PROJECT_STATUS_LABELS, ProjectStatus } from "@/lib/enums";
import { compactPeso, initials } from "@/lib/format";
import { PropertyImage } from "@/components/PropertyImage";
import { StylisedMap } from "@/components/app/StylisedMap";
import { ProjectInquiryForm, RegisterClientForm, ReserveButton } from "@/components/dev/ProjectPublicActions";

export const dynamic = "force-dynamic";

export default async function PublicProjectPage({ params }: { params: { slug: string } }) {
  const base = await prisma.project.findUnique({ where: { slug: params.slug }, include: { developer: { include: { user: true } } } });
  if (!base) notFound();
  const viewer = await getSessionUser();
  if (!(await canViewProject(viewer, base))) notFound();

  prisma.projectView.create({ data: { projectId: base.id, source: "web" } }).catch(() => {});

  const data = await projectDetail(base.id, viewer);
  if (!data) notFound();
  const { project, showAgentInfo, counts, groups, priceFrom, docs } = data;
  const amenities = project.amenities.map((a) => a.amenity.name);
  const unitTypes = groups.map((g) => g.unitType);

  // Agents with access see the full available-unit list with reserve + agent price.
  const agentUnits = showAgentInfo ? (await unitInventory(project.id, { status: "AVAILABLE", perPage: 50 }, true)).units : [];
  const commission = showAgentInfo ? project.defaultCommission : null;

  const cardForMap = project.latitude && project.longitude
    ? [{ id: project.id, title: project.name, area: `${project.barangay ? project.barangay + ", " : ""}${project.city}`, priceLabel: priceFrom ? `from ${compactPeso(priceFrom)}` : project.name, priceShort: priceFrom ? compactPeso(priceFrom) : "•", lat: project.latitude, lng: project.longitude, img: project.images[0]?.url } as never]
    : [];

  return (
    <div className="mx-auto max-w-[900px] pb-10">
      {/* hero */}
      <div className="relative h-[300px] overflow-hidden bg-line-2 md:h-[380px] md:rounded-xl2">
        <PropertyImage src={project.images[0]?.url} alt={project.name} placeholder="Project photograph" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
        <div className="absolute inset-x-5 bottom-5 text-white">
          <div className="mb-2 flex gap-2">
            <span className="rounded-full bg-white/90 px-3 py-1 font-sans text-[11px] font-semibold text-ink-2">Developer project</span>
            <span className="rounded-full bg-accent px-3 py-1 font-sans text-[11px] font-semibold">{PROJECT_STATUS_LABELS[project.status as ProjectStatus]}</span>
          </div>
          <h1 className="font-serif text-[34px] leading-none md:text-[44px]">{project.name}</h1>
          <div className="mt-2 flex items-center gap-1.5 font-sans text-[14px] text-white/85">
            <MapPin size={15} /> {project.barangay ? project.barangay + ", " : ""}{project.city}
          </div>
        </div>
      </div>

      <div className="grid gap-8 pt-6 md:grid-cols-[1fr_320px]">
        <div>
          {/* summary tiles */}
          <div className="flex flex-wrap gap-2">
            {priceFrom && <Tile value={`from ${compactPeso(priceFrom)}`} label="Starting price" />}
            <Tile value={counts.total} label="Total units" />
            <Tile value={counts.available} label="Available" />
            <Tile value={PROJECT_TYPE_LABELS[project.projectType as ProjectType]} label="Type" />
          </div>

          {project.description && (
            <Section title="About this development">
              <p className="whitespace-pre-line font-sans text-[15.5px] leading-[1.72] text-ink-3">{project.description}</p>
            </Section>
          )}

          {/* available unit types (brief §11) */}
          <Section title="Available units">
            {groups.length === 0 ? (
              <p className="font-sans text-[14px] text-muted">No units available right now.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {groups.map((g) => (
                  <div key={g.unitType} className="rounded-xl2 bg-surface p-4 shadow-card">
                    <div className="font-serif text-[22px] text-ink">{g.unitType}</div>
                    <div className="mt-1 font-sans text-[13px] text-muted">{g.areaRange || "—"} · {g.count} available</div>
                    <div className="mt-2 font-sans text-[15px] font-semibold text-accent">{g.priceRange}</div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* AGENT-ONLY inventory + reserve (brief §15, §16) */}
          {showAgentInfo && (
            <div className="mt-7 rounded-xl2 border border-accent/30 bg-surface-warm p-5">
              <div className="mb-3 flex items-center gap-2">
                <ShieldCheck size={18} className="text-accent" />
                <span className="font-sans text-[13px] font-semibold text-accent">Agent tools</span>
                {commission != null && <span className="ml-auto rounded-full bg-accent px-3 py-1 font-sans text-[12px] font-semibold text-white">Commission {commission}%</span>}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-left text-[13.5px]">
                  <thead>
                    <tr className="border-b border-line text-[10px] uppercase tracking-wide text-muted">
                      <th className="py-2 pr-3">Unit</th>
                      <th className="py-2 pr-3">Type</th>
                      <th className="py-2 pr-3">Public</th>
                      <th className="py-2 pr-3">Agent</th>
                      <th className="py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {agentUnits.map((u) => (
                      <tr key={u.id} className="border-b border-line-2">
                        <td className="py-2 pr-3 font-medium">{u.unitNumber}</td>
                        <td className="py-2 pr-3 text-muted">{u.unitType}</td>
                        <td className="py-2 pr-3 tabular-nums">{u.priceLabel}</td>
                        <td className="py-2 pr-3 tabular-nums text-accent">{u.agentPriceLabel || "—"}</td>
                        <td className="py-2"><ReserveButton unitId={u.id} unitNumber={u.unitNumber} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4"><RegisterClientForm projectId={project.id} unitTypes={unitTypes} /></div>
              {docs.filter((d) => d.visibility === "AGENT_ONLY").length > 0 && (
                <div className="mt-4 border-t border-line pt-3">
                  <div className="mb-2 font-sans text-[12px] font-semibold text-muted">Sales kit</div>
                  <div className="flex flex-wrap gap-2">
                    {docs.filter((d) => d.visibility === "AGENT_ONLY").map((d) => (
                      <a key={d.id} href={d.url} className="rounded-full bg-white px-3 py-1.5 font-sans text-[12.5px] font-medium text-ink-2 shadow-card">{d.title} ↓</a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {amenities.length > 0 && (
            <Section title="Amenities">
              <div className="flex flex-wrap gap-2">
                {amenities.map((a) => (
                  <span key={a} className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3.5 py-2.5 font-sans text-[13.5px] font-medium text-ink-3 shadow-card">
                    <Check size={13} className="text-success" /> {a}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {(project.paymentTerms || project.financingOptions) && (
            <Section title="Payment & financing">
              <div className="grid gap-px overflow-hidden rounded-2xl bg-line-2">
                {project.paymentTerms && <Row k="Payment terms" v={project.paymentTerms} />}
                {project.financingOptions && <Row k="Financing" v={project.financingOptions} />}
                {project.turnoverDate && <Row k="Turnover" v={new Date(project.turnoverDate).toLocaleDateString("en-PH", { month: "long", year: "numeric" })} />}
              </div>
            </Section>
          )}

          {cardForMap.length > 0 && (
            <Section title="Where it is">
              <StylisedMap pins={cardForMap} height={220} showPreview={false} />
            </Section>
          )}

          {/* public marketing docs */}
          {docs.filter((d) => d.visibility === "PUBLIC").length > 0 && (
            <Section title="Brochures & downloads">
              <div className="flex flex-wrap gap-2">
                {docs.filter((d) => d.visibility === "PUBLIC").map((d) => (
                  <a key={d.id} href={d.url} className="rounded-full bg-surface px-3.5 py-2 font-sans text-[13px] font-medium text-ink-2 shadow-card">{d.title} ↓</a>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* sidebar */}
        <aside className="md:sticky md:top-[80px] md:self-start">
          <div className="mb-4 rounded-xl2 bg-surface p-4 shadow-card">
            <Link href={`/developers/${project.developer.id}`} className="flex items-center gap-3">
              <div className="grid h-12 w-12 flex-none place-items-center rounded-full bg-ink font-sans text-[14px] font-bold text-white">{initials(project.developer.company)}</div>
              <div className="min-w-0">
                <div className="truncate font-sans text-[14.5px] font-medium text-ink">{project.developer.company}</div>
                {project.developer.verified && <div className="font-sans text-[12px] font-semibold text-success">✓ Verified developer</div>}
              </div>
            </Link>
          </div>

          <div className="rounded-xl2 bg-surface p-4 shadow-card">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles size={15} className="text-accent" />
              <span className="font-sans text-[13px] font-semibold text-accent">Request information</span>
            </div>
            <ProjectInquiryForm projectId={project.id} unitTypes={unitTypes} />
            <p className="mt-3 font-sans text-[11.5px] text-muted-2">Your inquiry goes directly to {project.developer.company}.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-7">
      <h3 className="mb-3.5 font-serif text-[22px] text-ink">{title}</h3>
      {children}
    </div>
  );
}
function Tile({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="stat-tile min-w-[100px] flex-1">
      <div className="serif-price text-[20px] leading-none">{value}</div>
      <div className="mt-1.5 font-sans text-[11.5px] font-medium text-muted">{label}</div>
    </div>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 bg-surface px-4 py-3.5">
      <span className="font-sans text-[14px] text-muted">{k}</span>
      <span className="text-right font-sans text-[14px] font-medium text-ink">{v}</span>
    </div>
  );
}
