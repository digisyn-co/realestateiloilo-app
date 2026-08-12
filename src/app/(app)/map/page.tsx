import { StylisedMap } from "@/components/app/StylisedMap";
import { SearchControls } from "@/components/app/SearchControls";
import { PropertyCard } from "@/components/PropertyCard";
import { parseSearchParams } from "@/lib/search";
import { getSavedIds, mapListings } from "@/lib/queries";
import { getSessionUser } from "@/lib/auth";
import { activeMapProvider } from "@/lib/map/provider";

export const dynamic = "force-dynamic";

export default async function MapPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const filters = parseSearchParams(searchParams);
  const [pins, user] = await Promise.all([mapListings(filters), getSessionUser()]);
  const savedIds = await getSavedIds(user?.id);

  return (
    <div>
      <SearchControls showMapLink={false} />
      <div className="flex items-baseline justify-between gap-3 pb-4 pt-5">
        <h1 className="font-serif text-[30px] leading-tight text-ink">Explore the map</h1>
        <span className="font-sans text-[12px] text-muted-2">provider: {activeMapProvider()}</span>
      </div>

      <StylisedMap pins={pins} height={440} />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pins.map((p) => (
          <PropertyCard key={p.id} p={p} initialSaved={savedIds.has(p.id)} />
        ))}
      </div>
      {pins.length === 0 && (
        <p className="mt-8 text-center font-sans text-[14.5px] text-muted">No listings in this area yet. Try widening your filters.</p>
      )}
    </div>
  );
}
