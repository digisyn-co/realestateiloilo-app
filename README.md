# Real Estate Iloilo

A modern real-estate marketplace focused on **Iloilo, Philippines** — the feel of Facebook Marketplace + Zillow + PropertyGuru, but exclusively for property, with a verification-first trust model and a broker-friendly **import engine**.

Built from the Claude Design prototype (`Real Estate Iloilo App.dc.html` + the Broker/Admin/Marketing design files). The prototype is the visual source of truth; the extracted design system lives in [`design-reference/`](design-reference/).

## Stack

- **Next.js 14** (App Router, React Server Components) + **TypeScript**
- **Tailwind CSS** with design tokens transcribed from the prototype
- **Prisma** ORM — **SQLite** locally, Postgres/PostGIS-ready for production
- Lightweight **JWT cookie auth** (`jose` + `bcryptjs`) with **server-side role enforcement**
- **Vitest** for unit tests · **lucide-react** icons · `next/font` (Instrument Serif + Manrope)

## Quick start

```bash
npm install
cp .env.example .env        # defaults work out of the box for local dev
npm run setup               # prisma db push + seed (creates dev.db with Iloilo data)
npm run dev                 # http://localhost:3000
```

Then build / test:

```bash
npm run build               # production build (prisma generate + next build)
npm run test                # 30 unit tests (dedupe, normalize, NL search, filters)
npm run typecheck           # tsc --noEmit
npm run db:reset            # wipe + reseed
```

### Demo logins (password `password123`)

| Role  | Email |
|-------|-------|
| Admin | `admin@realestateiloilo.app` |
| Broker | `carla@ilonggorealty.ph` |
| Buyer | `buyer@realestateiloilo.app` |

## What's implemented

**Public / buyer app** (light warm theme): marketing site (`/`, dark editorial), browse with structured **search / filter / sort** (`/browse`), **AI natural-language search** (`/ai`), interactive **map** with price pins (`/map`), rich **property detail** (gallery + lightbox, stats, AI notes, features, location, costs, agent, similar), **saved** + **compare**, **broker profiles**, **messages** (threads + composer), inquiries / viewing requests / reports, auth (`/login`, `/register`), account.

**Broker dashboard** (`/dashboard`, dark gold theme): overview KPIs, listings management (mark sold/reserved/rented), 11-step **add-listing wizard**, **leads** pipeline, viewings, **analytics** (views chart, top listings), **import listings** (URL + feed sources + review queue), settings.

**Admin console** (`/admin`): platform KPIs, accounts + broker verification, listing **approvals**, **reported** listings moderation, **import monitor**, **duplicate detection** review, **audit log**, moderation settings.

Every mutation is a server action or API route with server-side auth + Zod validation. Empty states, error states, and mobile bottom-tab navigation are all implemented.

## Database architecture

Full relational model in [`prisma/schema.prisma`](prisma/schema.prisma):

`User` · `Agent` · `AgentReview` · `Property` · `Amenity`/`PropertyAmenity` · `Listing` · `ListingImage` · `SavedProperty` · `Inquiry` · `Lead` · `Thread`/`Message` · `ViewingRequest` · `PropertyView` · `Report` · `ImportSource` · `ImportJob` · `ImportRecord` · `DuplicateMatch` · `Notification` · `AuditLog`.

Indexed on the hot paths (status, listingType, price, city, propertyType, lat/lng, publishedAt). Enum-like fields are stored as strings and validated in the app layer (`src/lib/enums.ts`) so the same schema runs on SQLite and Postgres. For production, switch the datasource `provider` to `postgresql` and enable PostGIS for true geospatial listing search.

## Import architecture (brief §13–21)

A pluggable, asynchronous pipeline — **not coupled to any one vendor** and containing **no unauthorised scraping**:

```
ImportSource → Adapter.fetch → normalize → image-rights check → dedupe →
compliance/permission gate → Review Queue (ImportRecord) → (reviewer) publish → Listing
```

- **Adapters** (`src/lib/import/adapters.ts`): `CSV`, `JSON`, `XML`, `BROKER_FEED`, `MANUAL_URL` (Open Graph / schema.org metadata only), and `META` — a **provider abstraction/mock** that is only "authorised" when an approved API token is configured. Each implements `MarketplaceAdapter` and is independently replaceable.
- **Normalization** (`normalize.ts`): raw → typed listing, resolving Iloilo locations to canonical areas + centroids, with per-field `warnings` for the reviewer.
- **Duplicate detection** (`dedupe.ts`): weighted multi-signal confidence score (source URL, phone, geo-proximity via haversine, address/title similarity, price, floor/lot area, beds/baths, type) → `92% likely duplicate` with **Merge / Separate / Ignore**. High-value matches are never auto-merged.
- **Compliance & rights** (`pipeline.ts`, brief §17/§18): source attribution is retained; imported images default to a rights-review state (never assumed reusable); nothing auto-publishes; scheduled sync only runs for sources explicitly marked *authorised* + *automated*.
- **Freshness** (`search.ts`): `Fresh / Recently updated / Needs verification / Possibly stale / Expired` from `lastVerifiedAt` / `updatedAt` / `sourceLastSeenAt` / `expiresAt`.

## What requires external credentials (isolated behind adapters/env)

Everything below is **architected and mocked**; drop in credentials in `.env` to go live. Nothing is faked to look complete — each integration is clearly isolated.

- **Meta / external marketplace API** — `META_MARKETPLACE_API_TOKEN`. Without it the adapter reports itself unauthorised (by design). No Marketplace login/scraping is performed.
- **Map provider** — `NEXT_PUBLIC_MAP_PROVIDER` (`stylised` default needs no key; `maptiler`/`mapbox`/`google` keys wire a real tile map via `src/lib/map/provider.ts`).
- **Object storage** for uploads — `STORAGE_PROVIDER` (`local` | `s3` | `supabase`).
- **Email/notifications** — `EMAIL_PROVIDER` (`console` dev default | `resend` | `smtp`).
- **Search engine** at scale — `SEARCH_PROVIDER` (`sql` default | Meilisearch/Typesense/OpenSearch).
- **Job queue** for scheduled imports — `QUEUE_DRIVER` (`inline` dev default | Redis/BullMQ | SQS) + `IMPORTS_AUTOMATION_ENABLED`.
- **LLM natural-language search** — `AI_PROVIDER=anthropic` + `ANTHROPIC_API_KEY` (a deterministic local parser is the always-on fallback).

See [`.env.example`](.env.example) for the full list.

## Limitations / next steps

- **Photography**: seed listings reference `/public/property-images/*` (the prototype's drop-target photos). Those binaries aren't bundled, so the UI shows tasteful warm placeholders. Add real photos to that folder (or wire object storage) and they appear automatically.
- Image thumbnail generation, real file uploads, OAuth SSO, and background job scheduling are scaffolded (interfaces + env) but run inline/stubbed locally.
- The git repository root is currently your home directory — consider `git init` inside this project folder before committing.
```bash
git init && git add . && git commit -m "Real Estate Iloilo"
```

## Project layout

```
prisma/            schema.prisma · seed.ts
src/lib/           auth · db · enums · iloilo · format · search · ai-search · queries
src/lib/import/    types · adapters · normalize · dedupe · pipeline
src/lib/map/       provider (map abstraction)
src/components/    PropertyCard · app/* (shell, gallery, map, controls) · dash/* · marketing/*
src/app/           (app)/* buyer routes · dashboard/* · admin/* · api/* · page.tsx (marketing)
tests/             ai-search · dedupe · import-normalize · search
design-reference/  DESIGN-SYSTEM.md · DASHBOARDS.md · SECONDARY-SCREENS.md
```
