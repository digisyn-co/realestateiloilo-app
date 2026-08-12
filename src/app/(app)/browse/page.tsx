import Link from "next/link";
import { SearchControls } from "@/components/app/SearchControls";
import { PropertyCard } from "@/components/PropertyCard";
import { EmptyState } from "@/components/app/EmptyState";
import { Pagination } from "@/components/app/Pagination";
import { parseSearchParams } from "@/lib/search";
import { getSavedIds, searchListings } from "@/lib/queries";
import { getSessionUser } from "@/lib/auth";
import { searchProjects } from "@/lib/developer/queries";
import { ProjectCard } from "@/components/dev/ProjectCard";
import { WelcomeBand } from "@/components/app/WelcomeBand";

export const dynamic = "force-dynamic";

export default async function BrowsePage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const filters = parseSearchParams(searchParams);
  const [{ items, total, page, perPage }, user] = await Promise.all([searchListings(filters), getSessionUser()]);
  const savedIds = await getSavedIds(user?.id);
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  // Developer projects matching the same search (brief §26). Shown first on page 1.
  const projects = (page || 1) === 1 ? await searchProjects(user, { q: filters.q, city: filters.city, take: 3 }) : [];

  const heading = filters.q
    ? `Results for “${filters.q}”`
    : filters.city
      ? `Homes in ${filters.city}`
      : filters.listingType === "RENT"
        ? "For rent in Iloilo"
        : "Homes across Iloilo";

  const isDefaultView = !filters.q && !filters.city && !filters.listingType && !filters.verifiedOnly && (filters.page || 1) === 1;

  return (
    <div>
      <SearchControls />
      {isDefaultView && <WelcomeBand />}
      <div className="flex items-baseline justify-between gap-3 pb-4 pt-5">
        <h1 className="font-serif text-[30px] leading-tight text-ink">{heading}</h1>
        <span className="flex-none font-sans text-[13px] font-medium text-muted">
          {total} {total === 1 ? "home" : "homes"}
        </span>
      </div>

      {projects.length > 0 && (
        <div className="mb-8">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-serif text-[22px] text-ink">Developer projects</h2>
            <span className="font-sans text-[12.5px] text-muted">{projects.length} nearby</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <ProjectCard key={p.id} p={p} />
            ))}
          </div>
        </div>
      )}

      {items.length > 0 ? (
        <>
          {projects.length > 0 && <h2 className="mb-3 font-serif text-[22px] text-ink">Individual listings</h2>}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => (
              <PropertyCard key={p.id} p={p} initialSaved={savedIds.has(p.id)} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} />
        </>
      ) : projects.length === 0 ? (
        <EmptyState
          title="Nothing matched exactly."
          body="Try widening the budget, or look at nearby districts."
          actionLabel="Clear filters"
          actionHref="/browse"
        />
      ) : null}

      <div className="mt-10 rounded-xl2 bg-surface-warm p-6 text-center shadow-card">
        <p className="font-sans text-[14.5px] text-ink-3">
          Prefer to describe it in words?{" "}
          <Link href="/ai" className="font-semibold text-accent">
            Try AI search →
          </Link>
        </p>
      </div>
    </div>
  );
}
