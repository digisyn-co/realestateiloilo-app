import Link from "next/link";
import { Building2 } from "lucide-react";
import { ProjectCardModel } from "@/lib/developer/queries";
import { PropertyImage } from "../PropertyImage";

/** Public project card — visually distinct from listing cards (brief §26). */
export function ProjectCard({ p }: { p: ProjectCardModel }) {
  return (
    <Link
      href={`/project/${p.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-card border border-accent/25 bg-surface shadow-elev transition-all duration-300 hover:-translate-y-[3px] hover:shadow-card-hover"
    >
      <div className="relative aspect-[16/11] flex-none overflow-hidden bg-line-2">
        <div className="absolute inset-0 transition-transform duration-[1000ms] ease-[cubic-bezier(.16,.84,.28,1)] group-hover:scale-[1.06]">
          <PropertyImage src={p.img} alt={p.name} placeholder="Development" />
        </div>
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 font-sans text-[11px] font-semibold text-white">
          <Building2 size={12} /> Development
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1.5 font-sans text-[11px] font-semibold text-ink-2 backdrop-blur">{p.status}</span>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4 pb-[18px]">
        {p.priceFromLabel && <div className="serif-price text-[24px] leading-none text-ink">from {p.priceFromLabel}</div>}
        <div className="font-sans text-[15.5px] font-medium leading-snug text-ink-2">{p.name}</div>
        <div className="font-sans text-[13.5px] text-muted">{p.area}</div>
        <div className="mt-auto flex items-center justify-between gap-2.5 pt-3">
          <span className="font-sans text-[12.5px] text-muted-2">{p.developerName}</span>
          <span className="font-sans text-[12.5px] font-semibold text-success">{p.availableUnits} available</span>
        </div>
      </div>
    </Link>
  );
}
