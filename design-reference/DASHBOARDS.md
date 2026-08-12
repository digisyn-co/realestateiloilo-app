# Dashboards & Marketing — design spec

Two distinct visual worlds:
- **Buyer app** = LIGHT, warm (`#FBF8F3`, terracotta `#B4551A`). See DESIGN-SYSTEM.md.
- **Broker + Admin dashboards + Marketing site** = DARK, editorial, gold.

## Dark theme tokens (dashboards + marketing)
| Token | Hex |
|---|---|
| bg | `#0B0A08` |
| bg-2 / panel | `#0E0D0B`, `#100E0B`, `#17150F` |
| text | `#F4F0E6` |
| gold (accent) | `#C9A227` |
| orange (admin alert/severity) | `#E2712B` |
| green (positive) | `#7E9877` / `#4C6046` |
| muted | `#8A8074`, `#A39784` |
| faint | `#6E655A`, `#4E4840` |
| line | `#1D1B16`, `#33302A`, `#26231E` |
Fonts identical: Instrument Serif (display/prices) + Manrope (UI). Marketing uses very small ALL-CAPS Manrope with wide letter-spacing (.16–.24em) for eyebrows/labels, big serif clamp() headlines, hairline gold section dividers, grain overlay + Ken-Burns image zoom.

## Marketing Site (`Marketing Site.dc.html`) — public landing, desktop-first, dark
Sticky header: wordmark "Real Estate *Iloilo*" (gold italic); nav: HOW IT WORKS, VERIFIED, DISTRICTS, PRICING, CAREERS; right: `FOR BROKERS` outline btn + `GET THE APP` gold btn.
Sections in order:
1. **Hero** — full-bleed photo (Ken Burns), headline "Every property in *Iloilo.* Verified.", subcopy, iOS/Android buttons, hero figures: **1,284 verified listings · 312 licensed brokers · 9 city districts** (count-up animated), floating "PLATE I · JARO" ticker.
2. **Press marquee** — Panay News (FEATURE), The Daily Guardian (INTERVIEW), Iloilo Business Club (PARTNER), PRC Iloilo Chapter (ACCREDITED).
3. **How it works** — 3 steps: 01 Describe what you want / 02 Compare what comes back / 03 Book the viewing in the app. + app demo device frame.
4. **Why verified matters** — 4 points (Listings that do not exist / We check the broker / We check the property / We check the photographs) + trust figures: 1,284 listings, 312 verified brokers, 41 avg days to sell, 24H typical verification.
5. **The districts** — 6 cards (3:4): Mandurriao 412 (₱2.4M–₱22M), Jaro 286 (₱1.8M–₱18M), Molo 174 (₱1.5M–₱9M), La Paz 138 (₱1.6M–₱11M), Pavia 121 (₱900K–₱6M), Oton 96 (₱1.1M–₱7M).
6. **For brokers** — 4 points, "APPLY TO LIST" + "SEE PRICING".
7. **For developers** — project card w/ live availability (Costa Verde Residences, 74/120 units sold, 62% bar).
8. **Broker pricing** — 3 plans: **Starter ₱1,490/mo** (8 listings, verified badge, lead inbox, basic analytics); **Pro Broker ₱2,490/mo** *featured* (25 listings, 4 boosts/mo, AI descriptions, full analytics, priority support); **Developer from ₱12,000/mo** (unlimited units, bulk CSV, project pages, account manager). "Buyers never pay. Verification is always free."
9. **Questions** — 6 FAQ accordion (free for buyers; what verified means; how AI search works; no commission; owner listings allowed; areas covered = 9 districts + Pavia/Oton/Santa Barbara/Leganes).
10. **Careers** — 5 roles (Senior Mobile Engineer, Trust & Safety Associate, Broker Success Manager, Product Designer, Field Photographer).
11. **Final CTA** — "Your next place is already in the register." + app buttons.
12. **Footer** — 3 columns (BUYERS / BROKERS / COMPANY) + "© 2026 Real Estate Iloilo · Western Visayas".

## Broker Dashboard (`Broker Dashboard.dc.html`) — dark, gold, sidebar app
Auth gate (login) then app shell. Sidebar nav (views):
**Overview, Listings, Add Listing (wizard), Leads, Viewings, Messages, Analytics, Projects, Subscription/Billing, Settings.** (+ Notifications.)
- **Overview KPIs:** Active Listings, Views This Week, Open Leads, Total Views, Enquiry Rate, Avg. Days Listed, Closed Value, Listings Used, Boosts Remaining, AI Credits, Saves. Weekly performance summary + Market movement chart.
- **Listings:** table/cards w/ status, asking price, listing type (SALE/RENT), NEGOTIABLE, views, saves; mark sold/reserved/rented.
- **Leads:** pipeline stages **NEW → OFFER → VIEWING → CLOSED**; lead cards.
- **Viewings:** viewing requests list.
- **Add Listing:** multi-step wizard (matches §12 of brief).
- **Settings:** Full name, Mobile number, PRC licence number, Brokerage details, Verification documents (PRC licence, Government ID, Brokerage certificate), Payout account, Team members, Subscription, Notifications (New lead alerts, Price alerts, Viewing alerts, Weekly performance summary), Change password, Two-factor authentication, Default district.
- Account types: Licensed Broker, Property Owner, Developer, Brokerage.

## Admin Dashboard (`Admin Dashboard.dc.html`) — dark, gold + orange severity, sidebar app
Login gate then shell. Sidebar nav (views):
**Overview, Accounts (staff/users/brokers), Verification (queue), Moderation, Reports, Content (Featured), Billing, Audit Log, Support, Settings.**
- **Overview KPIs:** Live Listings, Active Brokers, In Verification, Open Reports, Flagged Now, Resolved This Week, MRR, Monthly Active Users, Paying Brokers, AI Searches, Listing Views, Boost Revenue, Churn, Avg. Resolution, Avg. Days to Sell, Taken Down.
- **Verification queue:** checklist per applicant/listing — Broker verified, PRC licence, Government ID, Title number, Licence to sell, SEC registration, Project permits, Photo geotag, Photo freshness, Brokerage papers. Approve/Reject.
- **Moderation / Reports:** reported listings, high-severity flag (orange), Approve/Reject/Takedown; duplicate reports; "Duplicate of Lot …".
- **Imports & Duplicates:** duplicate detection sensitivity setting; import monitor. (Brief §14/15/21 — we implement the full side-by-side + confidence UI in the app.)
- **Settings:** Auto-approve threshold, Duplicate detection sensitivity, Automatic photo screening, Require 2FA for all staff, Role permissions, Audit log retention, Takedown grace period, Verification queue alerts, Daily digest, High-severity reports.
- **Audit log:** e.g. "Approved broker verification", "Approved listing", "Published district copy", "Duplicate of Lot 14 …".

## Web PropertyCard
Desktop variant of the mobile AppCard — same white card, image (16/11), type + drop pills, heart, price (serif), title, area, spec chips, verified + per-sqm footer. We build one responsive `<PropertyCard>` used across web + app widths.
