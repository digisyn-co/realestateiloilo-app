import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { getSavedListings } from "@/lib/queries";
import { PropertyCard } from "@/components/PropertyCard";
import { EmptyState } from "@/components/app/EmptyState";

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const user = await getSessionUser();
  if (!user) {
    return (
      <div className="pt-6">
        <h1 className="mb-4 font-serif text-[30px] text-ink">Saved homes</h1>
        <EmptyState title="Sign in to save homes" body="Tap the heart on any home and it will wait for you here." actionLabel="Sign in" actionHref="/login?next=/saved" />
      </div>
    );
  }
  const saved = await getSavedListings(user.id);
  const savedIds = new Set(saved.map((s) => s.id));

  return (
    <div className="pt-6">
      <div className="mb-4 flex items-baseline justify-between">
        <h1 className="font-serif text-[30px] text-ink">Saved homes</h1>
        <span className="font-sans text-[13px] text-muted">{saved.length} saved</span>
      </div>

      {saved.length > 0 ? (
        <>
          <Link href="/compare" className="mb-4 block rounded-2xl bg-surface px-5 py-4 text-center font-sans text-[14px] font-semibold text-ink-2 shadow-card">
            Compare saved homes →
          </Link>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((p) => (
              <PropertyCard key={p.id} p={p} initialSaved={savedIds.has(p.id)} />
            ))}
          </div>
        </>
      ) : (
        <EmptyState title="Nothing saved yet." body="Tap the heart on any home and it will wait for you here." actionLabel="Start browsing" actionHref="/browse" />
      )}
    </div>
  );
}
