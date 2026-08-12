# Real Estate Iloilo — Design System (source of truth)

Extracted from the Claude Design project `36f15150-...` (`Real Estate Iloilo App.dc.html` → `AppScreens.dc.html`, `AppCard.dc.html`).
This is the visual source of truth. Do NOT redesign — reproduce.

## Typography
- **Display / headings / prices:** `Instrument Serif` (serif). Weight 400. Italic used for accent words (e.g. *Iloilo*, in terracotta). letter-spacing ~ -.02em on large sizes. `font-variant-numeric: tabular-nums` on prices/stats.
- **Body / UI / labels:** `Manrope`, weights 400/500/600/700/800.
- Google Fonts: `Instrument+Serif:ital@0;1` and `Manrope:wght@400;500;600;700;800`.

### Type scale (observed)
- Hero H1: Instrument Serif 38px/1.04, -.02em
- Screen title H1: Instrument Serif 30px/1.06
- Section H2: Instrument Serif 26px/1
- Card price: Instrument Serif 27px/1
- Detail price: Instrument Serif 38px/1
- Subsection H3: Instrument Serif 22px/1.14
- Header title: Instrument Serif 24px/1.1
- Body: Manrope 14.5–15.5px / 1.6–1.72, color muted
- Labels/eyebrows: Manrope 600 12–13px, often terracotta
- Chips/pills: Manrope 500–600 11.5–13.5px

## Colors
| Token | Hex | Use |
|---|---|---|
| `--bg-page` | `#F3EDE4` | website page bg |
| `--bg-app` | `#FBF8F3` | app screen bg |
| `--surface` | `#FFFFFF` | cards, sheets |
| `--surface-warm` | `#FFF9F2` | AI/highlight card bg |
| `--surface-sand` | `#F6F1E9` | chip bg, secondary button |
| `--ink` | `#1A1714` | primary text |
| `--ink-2` | `#3D3630` | strong secondary text |
| `--ink-3` | `#5A524A` | body text |
| `--muted` | `#6B6259` | muted text |
| `--muted-2` | `#7A7268` | faint text |
| `--accent` | `#B4551A` | terracotta — primary brand/CTA/links |
| `--accent-soft` | `#FDF3EA` | accent tint (AI pill bg, ghost btn) |
| `--success` | `#2F6B4F` | verified green |
| `--success-soft` | `#EDF5F0` | verified badge bg |
| `--line` | `#E4DCD1` | borders/dividers |
| `--line-2` | `#F1EBE2` | subtle grid gap / image placeholder bg |
| `--line-3` | `#E0D8CC` | drag handle |
| `--map-bg` | `#EDF0E9` | map placeholder |
| `--map-road` | `#E2E7DC` | map roads |
| `--map-water` | `#DCE6E8` | map water |

## Radii
- Cards / hero / sheets: 18–20px
- Inputs / small tiles: 12–16px
- Pills / avatars / icon buttons: 999px

## Shadows
- Resting card: `0 1px 3px rgba(26,23,20,.05)` (sometimes `.06`/`.08`)
- Elevated card: `0 1px 3px rgba(26,23,20,.05), 0 8px 24px -16px rgba(26,23,20,.16)`
- Hover card: `0 2px 6px rgba(26,23,20,.06), 0 18px 36px -18px rgba(26,23,20,.24)` + `translateY(-3px)`
- Home CTA: `0 1px 3px rgba(26,23,20,.06), 0 10px 26px -18px rgba(26,23,20,.2)`
- Menu/popover: `0 8px 30px -8px rgba(26,23,20,.3)`
- Floating icon button: `0 2px 8px rgba(26,23,20,.14)`

## Interactions / motion
- App entrance: `appIn .5s ease` (opacity + translateY(10px))
- Section rise: `riseA`, sheet up: `sheetUpA`, heart pop: `popA`, skeleton shimmer: `shimA`, toast: `toastA`, map pin pulse ring: `ringA`.
- Card image hover zoom: `transform:scale(1.06)` over `1s cubic-bezier(.16,.84,.28,1)`.
- Icon button hover: `scale(1.08)`.
- Touch targets: min-height 40–52px.

## Icon language
Text/emoji glyphs in the prototype: `‹` back, `🔔` notifications, `✉` messages, `✦` AI/sparkle, `→` forward, `⚙` filters, `♥` save, `↗` share, `✓` verified/check, `···` card menu. In production, replace with a clean icon set (lucide) keeping the same shapes/weights.

## Reusable Property Card (`AppCard`)
- White, radius 18, overflow hidden, elevated shadow, hover lift.
- Image: aspect-ratio 16/11, warm placeholder `#F1EBE2`, hover zoom.
- Top-left chips: property type pill (white translucent, blur) + optional price-drop pill (terracotta, e.g. "↓ 6%").
- Top-right: circular save/heart button (white translucent, blur).
- Body: price (Instrument Serif 27), optional struck `wasLabel`, title (Manrope 500 15.5), area (muted 13.5), spec chips (sand pills: e.g. "3 bed", "2 bath", "120 sqm"), footer row: verified badge (green ✓) + per-sqm price (faint).
- Bottom-right `···` menu button → popover: Share / Add to compare / Report listing.
- Property type is `Property` object. onOpen, onSave, onShare, onCompare, onReport handlers.

## Buyer App screens (19) — from `AppScreens.dc.html`
Home, Results (buy/rent list), Detail, Explore (map), Broker profile, Saved, Compare, Messages (thread list + chat), Schedule (viewing calendar), AI search, Filters, Account, Settings, Notifications, Login, Register, Forgot password, Onboarding, Verify (why-verified sheet).

### Screen highlights
- **Home:** brand wordmark "Real Estate *Iloilo*", 🔔/✉ buttons; hero H1 "Find your place in *Iloilo.*"; big "Ask AI" CTA card + intent chips ("Buy"/"Rent"/"Land") + ⚙ filter button; featured hero image card with gradient + View; 3 stat tiles (heroFigures); "Featured homes" horizontal snap carousel of AppCards; "Browse by district" horizontal cards (image + district name + count); "Price drops" vertical list of AppCards.
- **Results:** sticky filter chips row + Map button; heading + count; grid of AppCards; empty state "Nothing matched exactly." with "Widen my search".
- **Detail:** 320px hero image (tap → lightbox), back/save/share floating buttons, "1 / 12 photos" pill; thumbnail strip; price (Instrument 38), title, area, verified pill ("· why?"); stat tiles (bed/bath/floor/lot/parking); "About this home" desc; **"What we noticed" AI card** (warm bg, sparkle, bullet list, disclaimer "Written by AI…"); "What's included" feature pills; "Where it is" stylized map + nearby places list; "Costs at a glance" breakdown rows; broker card (avatar, name, ✓ Verified broker); "Similar homes" carousel.
- **Explore (map):** filter chips; large map placeholder (stylized roads/water, district labels, price pins as buttons, count badge); drag handle; horizontal snap row of mini property cards (image, price, title, area, "View home").
- **Broker profile:** cover image + avatar overlap, name + "✓ Verified broker", "Iloilo City · PRC #… · Replies in ~2h"; Message / Book a viewing buttons; stat tiles; tabs (About/Listings/Reviews); About = bio + credentials rows; Listings = AppCards; Reviews = review cards (name, stars, text).
- **Saved:** collections chips; "Compare N homes" button; list of AppCards; empty "Nothing saved yet."
- **Compare:** horizontal-scroll comparison table (columns = properties w/ image+title+Remove, rows = spec labels + cells); empty "Nothing to compare yet."
- **Messages:** thread list (avatar initials, name, time, preview) OR chat view (broker header + Book, property context card, message bubbles, composer input + Send).
- **Schedule:** property context; month calendar grid (dow + day buttons, selected state); time-slot grid; "Request this viewing"; success state "You're booked in".
- **AI search:** input card (sparkle label + serif textarea + "Find homes"); idle suggestions list; parsed "Looking for" criteria chips; thinking = skeleton shimmer cards; done = results.
- **Filters, Account, Settings, Notifications, Auth (Login/Register/Forgot), Onboarding, Verify:** see design-reference/SECONDARY-SCREENS.md.

## Bottom tab bar
Center AI (sparkle) action; tabs incl Home, Buy/Search, Saved, Account/Inbox. (See SECONDARY-SCREENS.md for exact items.)

## Other design files
- `Broker Dashboard.dc.html`, `Admin Dashboard.dc.html`, `Marketing Site.dc.html`, `PropertyCard.dc.html` (web card variant). See design-reference/DASHBOARDS.md.
- `ios-frame.jsx` = device-mockup wrapper (presentation only, not app logic). `support.js`/`image-slot.js` = Claude Design runtime (not reproduced; we build real React).

## Iloilo geography (for data + search)
Iloilo City districts: City Proper, Jaro, Mandurriao, La Paz, Lapuz, Molo, Arevalo.
Iloilo province municipalities: Pavia, Oton, Leganes, Santa Barbara, San Miguel, Cabatuan, Zarraga, Dumangas, Passi City, and others.
Currency: Philippine Peso ₱, tabular-nums, grouped thousands (e.g. ₱8,900,000).
