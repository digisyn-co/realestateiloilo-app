import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatPeso } from "@/lib/format";
import { publishRecordAction, setRecordStatusAction, resolveDuplicateAction } from "@/lib/dashboard-actions";

const STATUS_TONE: Record<string, string> = {
  NEEDS_REVIEW: "#D6A84F", DUPLICATE: "#E2712B", APPROVED: "#6FB58F", PUBLISHED: "#6FB58F",
  REJECTED: "#C05B4A", PENDING: "#95A79C", PROCESSING: "#95A79C", ARCHIVED: "#95A79C", SOURCE_UNAVAILABLE: "#C05B4A",
};

type Normalized = {
  title: string; price: number; city: string; barangay?: string; propertyType: string; listingType: string;
  bedrooms?: number; bathrooms?: number; floorArea?: number; lotArea?: number; description?: string;
  sourceUrl?: string; images?: { url: string; rights: string }[]; warnings?: string[];
};

export async function ImportRecordCard({ recordId, showAdmin = false }: { recordId: string; showAdmin?: boolean }) {
  const record = await prisma.importRecord.findUnique({
    where: { id: recordId },
    include: { source: true, matches: true },
  });
  if (!record) return null;
  const norm = safe<Normalized>(record.normalized);
  const raw = safe<Record<string, unknown>>(record.raw);
  const dupListing = record.dupListingId
    ? await prisma.listing.findUnique({ where: { id: record.dupListingId }, include: { property: true } })
    : null;

  return (
    <div className="border border-[#183A2B] bg-[#0C2018]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#183A2B] px-5 py-4">
        <div>
          <div className="font-serif text-[19px]">{norm?.title || "Untitled"}</div>
          <div className="text-[11.5px] text-[#95A79C]">
            {record.source?.name} · {record.source?.adapter}
            {record.sourceUrl && (
              <> · <a href={record.sourceUrl} target="_blank" rel="noreferrer" className="text-[#D6A84F]">source ↗</a></>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {record.dupConfidence != null && (
            <span className="rounded-full bg-[#E2712B]/15 px-3 py-1 text-[11px] font-bold text-[#E2712B]">{record.dupConfidence}% likely duplicate</span>
          )}
          <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: STATUS_TONE[record.status] }}>
            {record.status.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      {/* side-by-side: original vs normalized */}
      <div className="grid gap-px bg-[#183A2B] md:grid-cols-2">
        <div className="bg-[#05120C] p-5">
          <div className="mb-3 text-[8.5px] font-semibold uppercase tracking-[0.18em] text-[#95A79C]">Original (source)</div>
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words text-[12px] leading-relaxed text-[#F4F0E6]/70">
            {JSON.stringify(raw, null, 2)}
          </pre>
        </div>
        <div className="bg-[#05120C] p-5">
          <div className="mb-3 text-[8.5px] font-semibold uppercase tracking-[0.18em] text-[#D6A84F]">The Iloilo Real Estate (normalised)</div>
          <dl className="grid gap-1.5 text-[13px]">
            <Kv k="Price" v={norm ? formatPeso(norm.price) : "—"} />
            <Kv k="Type" v={`${norm?.propertyType} · ${norm?.listingType}`} />
            <Kv k="Location" v={`${norm?.barangay ? norm.barangay + ", " : ""}${norm?.city}`} />
            <Kv k="Specs" v={[norm?.bedrooms && `${norm.bedrooms} bed`, norm?.bathrooms && `${norm.bathrooms} bath`, norm?.floorArea && `${norm.floorArea} sqm`].filter(Boolean).join(" · ") || "—"} />
            <Kv k="Images" v={`${norm?.images?.length || 0} (rights: ${record.rightsFlag.replace("_", " ").toLowerCase()})`} />
          </dl>
          {norm?.warnings && norm.warnings.length > 0 && (
            <div className="mt-3 border-t border-[#183A2B] pt-2 text-[11.5px] text-[#E2712B]">⚠ {norm.warnings.join(" · ")}</div>
          )}
        </div>
      </div>

      {/* duplicate comparison */}
      {dupListing && (
        <div className="border-t border-[#183A2B] bg-[#0A1B14] px-5 py-4">
          <div className="mb-2 text-[8.5px] font-semibold uppercase tracking-[0.18em] text-[#E2712B]">Possible duplicate of an existing listing</div>
          <Link href={`/property/${dupListing.id}`} className="text-[13.5px] text-[#F4F0E6] hover:text-[#D6A84F]">
            {dupListing.property.title} · {formatPeso(dupListing.price)} · {dupListing.property.city} ↗
          </Link>
          {record.matches[0] && (
            <form action={resolveDuplicateAction} className="mt-3 flex flex-wrap gap-2">
              <input type="hidden" name="id" value={record.matches[0].id} />
              <button name="resolution" value="MERGED" className="border border-[#245140] px-3 py-2 text-[11px] font-semibold hover:border-[#D6A84F] hover:text-[#D6A84F]">Merge (keep existing)</button>
              <button name="resolution" value="SEPARATE" className="border border-[#245140] px-3 py-2 text-[11px] font-semibold hover:border-[#D6A84F] hover:text-[#D6A84F]">Keep separate</button>
              <button name="resolution" value="IGNORED" className="border border-[#245140] px-3 py-2 text-[11px] font-semibold text-[#95A79C] hover:border-[#C05B4A] hover:text-[#C05B4A]">Ignore</button>
            </form>
          )}
        </div>
      )}

      {/* actions */}
      {record.status !== "PUBLISHED" && record.status !== "REJECTED" && (
        <div className="flex flex-wrap gap-2 border-t border-[#183A2B] px-5 py-4">
          <form action={publishRecordAction}>
            <input type="hidden" name="recordId" value={record.id} />
            <button className="border border-[#D6A84F] bg-[#D6A84F] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#05120C]">
              {showAdmin ? "Approve & publish" : "Publish to my listings"}
            </button>
          </form>
          <form action={setRecordStatusAction}>
            <input type="hidden" name="recordId" value={record.id} />
            <input type="hidden" name="status" value="REJECTED" />
            <button className="border border-[#245140] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#95A79C] hover:border-[#C05B4A] hover:text-[#C05B4A]">Reject</button>
          </form>
        </div>
      )}
      {record.status === "PUBLISHED" && record.publishedListingId && (
        <div className="border-t border-[#183A2B] px-5 py-3 text-[12.5px] text-[#6FB58F]">
          Published · <Link href={`/property/${record.publishedListingId}`} className="text-[#D6A84F]">view listing ↗</Link> (pending admin approval to go live)
        </div>
      )}
    </div>
  );
}

function Kv({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-[#95A79C]">{k}</span>
      <span className="text-right text-[#F4F0E6]">{v}</span>
    </div>
  );
}
function safe<T>(s: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}
