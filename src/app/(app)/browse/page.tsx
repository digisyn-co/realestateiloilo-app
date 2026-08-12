import Link from "next/link";
import { SearchControls } from "@/components/app/SearchControls";
import { PropertyCard } from "@/components/PropertyCard";
import { EmptyState } from "@/components/app/EmptyState";
import { Pagination } from "@/components/app/Pagination";
import { parseSearchParams } from "@/lib/search";
import { getSavedIds, searchListings } from "@/lib/queries";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function BrowsePage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const filters = parseSearchParams(searchParams);
  const [{ items, total, page, perPage }, user] = await Promise.all([searchListings(filters), getSessionUser()]);
  const savedIds = await getSavedIds(user?.id);
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const heading = filters.q
    ? `Results for “${filters.q}”`
    : filters.city
      ? `Homes in ${filters.city}`
      : filters.listingType === "RENT"
        ? "For rent in Iloilo"
        : "Homes across Iloilo";

  return (
    <div>
      <SearchControls />
      <div className="flex items-baseline justify-between gap-3 pb-4 pt-5">
        <h1 className="font-serif text-[30px] leading-tight text-ink">{heading}</h1>
        <span className="flex-none font-sans text-[13px] font-medium text-muted">
          {total} {total === 1 ? "home" : "homes"}
        </span>
      </div>

      {items.length > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => (
              <PropertyCard key={p.id} p={p} initialSaved={savedIds.has(p.id)} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} />
        </>
      ) : (
        <EmptyState
          title="Nothing matched exactly."
          body="Try widening the budget, or look at nearby districts."
          actionLabel="Clear filters"
          actionHref="/browse"
        />
      )}

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
