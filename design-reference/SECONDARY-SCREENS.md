# Real Estate Iloilo — Secondary Screens & Shared Chrome Spec

Source: `AppScreens.dc.html` (Claude Design prototype), second half of the template plus the
`<script type="text/x-dc">` logic at the end. This documents everything **after** the ~41k mark:
auth flow, Account, Settings, Notifications, Filters, the "why verified" sheet, plus the shared
header/tab-bar chrome and the full component state + seed-data model.

All tokens match the already-known palette unless explicitly flagged below under **Divergent tokens**.

---

## Component State Model

Single-component app. `screen` drives which `<sc-if>` block renders. Navigation is a manual stack.

### `screen` values (19 total)
`login`, `register`, `verify`, `forgot`, `onboarding`, `home`, `results`, `filters`, `detail`,
`explore`, `broker`, `saved`, `compare`, `messages`, `schedule`, `ai`, `account`, `notifications`, `settings`.
Default start screen = `home`. Auth group = `['login','register','verify','forgot','onboarding']`.

### Navigation
- `go(screen, extra)` — pushes current screen onto `stack`, sets new screen (+ optional state), scrolls `main` to top.
- `back()` — pops `stack` (falls back to `home`), scrolls to top. Back button shows only when `stack.length > 0`.
- `flash(msg)` — shows a toast for 2000ms.

### Initial `state` (verbatim)
```js
screen:null, stack:[], propId:'p1', t:0,
saved:{}, compare:[], coll:'All',
fIntent:'Buy', fLocation:'Iloilo City', fType:'Any type', budgetMax:30000000,
aiQuery:'', aiStage:'idle', aiCrit:[],
bTab:'About', thread:0, chatOpen:false, draft:'', chatExtra:[],
day:null, slot:null, scheduled:false,
lightbox:false, verify:false, toast:'', results:null, heading:'All homes',
acctType:'Buyer', terms:false, code:'', forgotSent:false,
obStep:1, obIntent:'Buy a home', obBudget:6000000, obAreas:{ Mandurriao:true },
notifTab:'All', read:{}, settings:{ alerts:true, priceDrops:true, viewings:true, marketing:false, biometric:true },
fTypes:{}, fLocs:{}, fBeds:'Any', fFeats:{}
```

Note: `verify` (boolean) = the "why verified" **bottom sheet** toggle. This is different from the
`verify` **screen** (the OTP screen). The sheet uses `verifyOpen`/`closeVerify`; the OTP screen uses `isVerify`.

### Per-screen header titles (`TITLES` map)
`results:'Search results'`, `explore:'Explore'`, `broker:'Broker'`, `saved:'Saved homes'`,
`compare:'Compare'`, `messages:'Messages'`, `schedule:'Book a viewing'`, `ai:'Ask AI'`, `detail:'Home'`,
`account:'Account'`, `notifications:'Notifications'`, `settings:'Settings'`, `filters:'Filters'`,
`register:'Sign up'`, `verify:'Verify your number'`, `forgot:'Password'`.
Fallback title (home etc.) = `Real Estate Iloilo`.

---

## Shared Chrome

### Status-bar spacer
When `showBar` (framed preview), a `height:54px` (`topPad`) spacer sits above the header.

### Header (`hasHeader` = not home, not detail, not any auth screen)
`<header>` flex row, `padding:8px 16px 12px`, `background:#FBF8F3`, `z-index:60`:
- **Back button** (only if `canBack`): 42×42 circle, white, shadow, glyph `‹`, font-size 17.
- **Title**: Instrument Serif `400 24px/1.1`, ellipsis-truncated, flex:1.
- **"✦ Ask AI" pill** (only if `showAiBtn`): 42px tall pill, `background:#FDF3EA`, `color:#B4551A`,
  Manrope `600 13px`. Hidden on screens `ai`, `filters`, `settings`, `notifications`.

Home and detail render their own top area instead of this header.
- **Home top-right**: bell button `🔔` → `goNotifications`, with unread badge (min-width 18px pill,
  `background:#B4551A`, white `700 10px`) showing `unread` count; and envelope `✉` → `goMessages`.

### Bottom tab bar (`nav`, shown when NOT an auth screen — `showNav = !isAuth`)
White, `box-shadow:0 -4px 20px -12px rgba(26,23,20,.28)`, `z-index:60`, 5 equal columns,
`padding-bottom: navPad` (24px framed / 8px unframed). Each tab is a vertical button
(icon glyph + label Manrope `600 10.5px`). Active color `#B4551A`, inactive `#7A7268`.

Tab items in order (`tabs` array):
| # | key | icon glyph | label | note |
|---|-----|-----------|-------|------|
| 1 | `home` | `⌂` | Home | |
| 2 | `explore` | `◎` | Explore | |
| 3 | `ai` | `✦` | Ask AI | **hero/center** |
| 4 | `saved` | `♥` | Saved | |
| 5 | `account` | `◍` | Account | |

Center **Ask AI** is the hero action: its icon sits in a 34×34 circle. Active = `background:#B4551A;color:#fff`;
inactive = `background:#FDF3EA;color:#B4551A`. Non-hero icons are plain 17px glyphs.
Each tab `onPick → go(key)`.

### Detail sticky CTA bar (`showDetailCta`, detail screen only)
Above the nav: **"Book a viewing"** (flex:1, accent `#B4551A`, white) → `goSchedule`; and
**"Message"** (white, shadow) → `goMessages`.

### Global overlays
- **Lightbox** (`lightbox`): full-bleed `#1A1714`, header "1 of 12 photos" + ✕ close, single photo. `closeLightbox`.
- **"Why this is verified" sheet** (`verifyOpen`) — see Verify section below.
- **Toast** (`toast`): centered dark pill at `bottom: toastBottom` (100px framed / 80px unframed),
  `background:#1A1714`, white `600 13.5px`.

---

## Auth Flow

Overall auth layout: no header, no nav. Screens fade in with `animation:appIn .45s ease`.
Shared field styles (from `renderVals`):
- `labelStyle` = `font:600 13px/1 Manrope;color:#6B6259;margin-bottom:10px`
- `inputStyle` = `width:100%;padding:15px 16px;border:none;border-radius:14px;background:#FFFFFF;box-shadow:0 1px 3px rgba(26,23,20,.06);font:400 15.5px/1.2 Manrope;color:#1A1714;min-height:52px`

### Login (`isLogin`)
- **Hero banner**: 210px tall rounded (20px) image (`auth-bg`, `images/b1.png`) with dark gradient
  overlay and title **"Real Estate _Iloilo_"** (Instrument Serif 28px, "Iloilo" italic) bottom-left.
- **H1**: "Welcome back" (Instrument Serif 30px).
- Fields: **"Email or mobile"** (placeholder `maria@example.ph`); **"Password"** (type password,
  placeholder `••••••••`) with a **"Forgot?"** text button (`#B4551A`) → `goForgot`.
- **"Sign in"** primary button (full-width, accent, 17px pad, radius 14, min-height 54) → `signIn`.
- Divider "or".
- **SSO buttons** (`ssoOptions`) — white pill rows, icon + label:
  - `` (Apple glyph, empty in source) "Continue with Apple"
  - `G` "Continue with Google"
  - `✆` "Continue with mobile number"
  - All three → `setState({ screen:'verify', stack:['login'] })`.
- Footer: "New here? **Create an account**" → `goRegister`.
- **"Just browsing for now"** button (sand `#F6F1E9`, muted) → `browseGuest`.

### Register (`isRegister`)
- **H1**: "Create your account".
- Sub copy: "Free for buyers and renters. Brokers sign up in the broker dashboard."
- **Account type segmented** (`accountTypes`): `Buyer` / `Renter` (segStyle pills; active = dark `#1A1714`) → sets `acctType`.
- **Fields** (`registerFields`):
  1. "Full name" — text — ph `Jules Ramirez`
  2. "Email" — email — ph `jules@example.ph`
  3. "Mobile number" — tel — ph `+63 917 000 0000`
  4. "Password" — password — ph `At least 8 characters`
- **Terms checkbox row** (white card, custom 24×24 checkbox, ✓ when on):
  "I agree to the **terms** and **privacy policy**, and to listing alerts." → `toggleTerms`.
- **"Create account"** button — enabled only when `terms` true (accent when enabled; disabled =
  `background:#F1EBE2;color:#7A7268;not-allowed`). `submitRegister`: if terms → `go('verify')`,
  else flash "Please accept the terms".
- Footer: "Already have one? **Sign in**" → `goLogin`.

### Verify — OTP screen (`isVerify`)
- **H1**: "Check your messages".
- Copy: "We sent a six-digit code to **+63 917 •• 4821**."
- **6 code boxes** (`codeBoxes`): flex cells, aspect 3/4, max-height 68px, Instrument Serif 25px.
  Active (next-to-fill) box has `box-shadow:0 0 0 2px #B4551A`.
- **Numeric keypad** (`keypad`), 3-column grid: `1 2 3 / 4 5 6 / 7 8 9 / (blank) 0 ⌫`.
  Keys Instrument Serif 22px white cards; `⌫` deletes, digits append up to 6.
- **"Verify and continue"** button — enabled when 6 digits entered. `submitVerify` →
  `go('onboarding', { obStep:1 })`; else flash "Enter the six-digit code".
- **"Send a new code"** text button → `resend` → flash "New code sent".

### Forgot (`isForgot`)
Two states (`forgotOpen = !forgotSent`):
- **Form state**: H1 "Reset your password"; copy "Enter the email on your account and we'll send a link.";
  single "Email" field (ph `maria@example.ph`); **"Send reset link"** button → `sendReset` (sets `forgotSent`).
- **Sent state** (`forgotSent`): centered 60px green success circle (`background:#EDF5F0;color:#2F6B4F`, ✓);
  H1 "Check your email"; copy "If an account exists for that address, a reset link is on its way.
  It expires in one hour."; **"Back to sign in"** button → `goLogin`.

### Onboarding (`isOnboarding`) — 3 steps
Layout: 3 progress ticks at top (`obTicks`, active `#B4551A`, inactive `#EAE3D9`), title + body, step body, footer with **Skip** (sand) + primary button.
- `obTitle` per step: `["What brings you here?", "What is your ceiling?", "Which districts do you like?"]`
- `obBody` per step: `["We will shape your home screen and alerts around this.",
  "You can change this any time in filters.",
  "Pick as many as you like — we will tell you when something new appears."]`
- **Step 1 (intent)** `obIntents`: list of full-width option buttons `Buy a home` / `Rent a place` /
  `Invest` / `Buy land`. Selected = accent bg with `✓` mark. Sets `obIntent`.
- **Step 2 (budget)**: big `obBudgetLabel` (Instrument Serif 40px, accent) driven by a range slider
  (`min 500000 max 30000000 step 250000`, accent). Preset buttons (`obBudgetPresets`, 2-col grid):
  `Under ₱3M` (3M), `Under ₱5M` (5M), `Under ₱10M` (10M), `No limit` (30M).
- **Step 3 (areas)** `obAreas`: wrap of `LOCS` pill chips (multi-select), seeded `Mandurriao:true`.
- Footer button label = `Continue` (steps 1–2) / **"Start looking"** (step 3). `obNext`: last step →
  `go home` with `budgetMax=obBudget`, `fIntent` derived from intent, flash "All set — happy hunting";
  else advance step. **Skip** (`obSkip`) → `screen:'home'`.

---

## Account (`isAccount`)

- **Profile header card** (white, radius 20): 62px circle avatar with initials **"JR"**
  (Instrument Serif 23px `#B4551A` on `#FDF3EA`); `{{ user.name }}` (Instrument Serif 23px) +
  `{{ user.email }}` (Manrope 13px muted, ellipsis); **"Edit"** pill (sand) → `editProfile`
  (flash "Opening your profile").
  - `user = { name:'Jules Ramirez', email:'jules.ramirez@gmail.com' }`.
- **Stat tiles row** (`userStats`, 3 tiles, Instrument Serif 24px value + Manrope label):
  - `Saved` = count of saved ids → `go('saved')`
  - `Comparing` = compare length → `go('compare')`
  - `Viewings` = `'3'` → `go('schedule')`
- **Menu groups** (`accountGroups`): grouped rows in a 16px-radius card, `#F1EBE2` 1px separators.
  Each row = 34px circle icon (`#FDF3EA`/`#B4551A`), label (Manrope 500 15px), optional right `meta`
  text, chevron `›`.
  - **"Your activity"**:
    - `♥` "Saved homes" — meta = saved count (blank if 0) → `go('saved')`
    - `◷` "My viewings" — meta `3` → `go('schedule')`
    - `✉` "Messages" — meta `2` → `go('messages', {chatOpen:true})`
    - `✦` "Saved searches" — meta `4` → flash "Opening saved searches"
  - **"Preferences"**:
    - `🔔` "Notifications" → `go('notifications')`
    - `⚙` "Settings" → `go('settings')`
    - `◎` "Search preferences" → `go('filters')`
  - **"Help"**:
    - `?` "Help centre" → flash "Opening help centre"
    - `⚑` "Report a problem" → flash "Opening report form"
    - `▤` "Terms and privacy" → flash "Opening terms"
- **"Sign out"** button (white card, `color:#B4551A`) → `signOut`.
- Footer text: **"Version 1.4.2 · Iloilo City"**.

---

## Settings (`isSettings`)

Grouped rows (`settingsGroups`), same card/separator styling as Account. Each row: label
(Manrope 500 15px) + optional `sub` (Manrope 12.5px muted). Rows are either a **toggle** or a **value** row.

- **"Alerts"** (all toggles, bound to `state.settings`):
  - `alerts` "New home alerts" — sub "Matches for your saved searches" (default ON)
  - `priceDrops` "Price drops" — sub "On homes you have saved" (default ON)
  - `viewings` "Viewing reminders" — sub "Two hours before an appointment" (default ON)
  - `marketing` "Product news" — sub "Occasional updates from the team" (default OFF)
- **"Security"**:
  - `biometric` toggle "Face ID sign-in" — sub "Use Face ID instead of a password" (default ON)
  - value row "Change password" → value `Update`
  - value row "Active sessions" → value `2 devices`
- **"Region"** (all value rows):
  - "Currency" → `PHP ₱`
  - "Area units" → `sqm`
  - "Language" → `English`

Toggle switch: 52×31 track, radius 999, ON `background:#B4551A` (knob right), OFF `background:#E6DFD4`
(knob left); 25px white knob. Value rows show `{{ value }} ›` as a `#B4551A` text button; toggling a
keyed row updates `settings`; non-keyed value rows flash "Opening &lt;label&gt;".

---

## Notifications (`isNotifications`)

- **Filter tabs** (`notifTabs`, horizontal scroll): `All` / `Homes` / `Messages`
  (tabStyle pills — active `background:#FDF3EA;color:#B4551A`). Plus a right-aligned
  **"Mark all read"** text button (`#B4551A`) → `markAllRead` (marks all read, flash "All caught up").
- **Notification rows** (`notifications`, filtered by tab): white card row, radius 18, containing:
  - **Unread dot** (8px): `#B4551A` when unread, transparent when read. Unread rows get a slightly
    stronger shadow.
  - **Text** (Manrope 500 14.5px) + meta line `{{ kind }} · {{ age }}` (Manrope 12.5px `#7A7268`).
  - Optional **62×50 thumbnail** (radius 12) if `img` present.
- Seed data (6):
  | id | kind | text | age | img |
  |----|------|------|-----|-----|
  | n1 | Homes | "The price dropped on Starter Home near the Highway — now ₱3,450,000." | 12m ago | b9.png |
  | n2 | Messages | "Maria Santos replied about the Mandurriao house." | 2h ago | — |
  | n3 | Homes | "Three new homes in Mandurriao under ₱5M." | 5h ago | a1.png |
  | n4 | Messages | "Your Saturday 10:00 viewing was confirmed." | Yesterday | — |
  | n5 | Homes | "Condo with City View was verified by our team." | 2d ago | a6.png |
  | n6 | Homes | "A home you saved is now under offer." | 3d ago | a2.png |
- Row `onPick`: marks that id read; if `kind==='Messages'` → `go('messages', {chatOpen:true})`,
  else → `go('detail', {propId:'p1'})`.
- `unread` badge count (used on home bell) = number of the 6 ids not in `state.read`.

---

## Filters (`isFilters`)

Scrolling form (`padding:0 16px`) with a fixed bottom action row. Section labels use `labelStyle`.
Filter chip pills use the shared `pill(on)` helper (ON = `#B4551A` white; OFF = white card).

Groups in order:
1. **Intent segmented** (`intents`, top): `Buy` / `Rent` / `Lease` (segStyle; active dark `#1A1714`) → sets `fIntent`.
2. **"Budget ceiling"**: big `fBudgetLabel` = "Up to &lt;short&gt;" (Instrument Serif 32px accent) + range
   slider (`min 500000 max 30000000 step 250000`) → `onBudget` sets `budgetMax`.
3. **"Property type"** (`typeChips`, multi-select from `TYPES`): `House, Condo, Apartment, Land,
   Commercial, Office, Townhouse` → toggles `fTypes`.
4. **"District"** (`locChips`, multi-select from `LOCS`): `Mandurriao, Jaro, Molo, La Paz, Arevalo,
   City Proper, Pavia, Oton, Santa Barbara` → toggles `fLocs`.
5. **"Bedrooms"** (`bedChips`, single-select, segStyle): `Any, 1+, 2+, 3+, 4+` → sets `fBeds`.
6. **"Must have"** (`featureChips`, multi-select from `FEATS`): `Parking, Gated, Furnished,
   Clean title, Flood-free, Pet friendly` → toggles `fFeats`.

**Bottom action row** (`padding:20px 16px 24px`):
- **"Reset"** (sand `#F6F1E9`, muted) → `resetFilters` (clears types/locs/feats, `fBeds='Any'`, `budgetMax=30000000`).
- **"Show {{ filterCount }} homes"** (accent, flex:1) → `applyFilters` → `go('results', { results:<matched ids>, heading:'Your matches' })`.

`filterCount` = count from `filterMatch` logic: excludes rent when intent=Buy (and vice-versa);
filters by selected types, selected districts, `fBeds` minimum, and (for non-rent) price ≤ budgetMax.
Note: the `featureChips` (`fFeats`) are collected but NOT applied in `filterMatch`. Only the applied
axes are intent, type, district, beds, budget.

---

## Verify — "Why this is verified" bottom sheet (`verifyOpen`)

Bottom sheet, `background:#FBF8F3`, radius `24px 24px 0 0`, drag handle, slide-up animation.
- **Title**: "Why this is verified" (Instrument Serif 25px).
- **Points** (`verifyPoints`), each a white card row with a green ✓ badge (`#EDF5F0`/`#2F6B4F`):
  1. "We checked the broker's PRC licence and government ID against the name on the account."
  2. "We matched the title number against the registry extract."
  3. "Someone from our team confirmed the photos match the property on site."
- **"Got it"** button (dark `#1A1714`, white). Opened via a verified badge on detail (`setState verify:true`),
  closed via `closeVerify`.

---

## Seed Data Model (for the real data layer)

### `DATA` — 14 properties (`p1`–`p14`)
Shape: `{ id, title, type, area, dist, price, beds?, baths?, lot?, floor?, park?, verified, feat?,
rent?, was?, drop?, listed }`.
- `type` ∈ House, Condo, Apartment, Land, Commercial, Office, Townhouse.
- `dist` ∈ district names. `price` in ₱ (sale absolute; rentals have `rent:true` and price = monthly).
- `verified` string ∈ "Verified listing" / "Verified owner" / "Verified developer".
- `feat:true` = featured; `was`+`drop` = price-drop (e.g. `drop:'−8%'`); `listed` = relative age.
- Examples:
  - `p1` "Modern 3-Bedroom Family Home", House, Mandurriao, ₱4,850,000, 3bd/2ba, lot 150, floor 120, park 2, "Verified listing", featured, "6 days ago".
  - `p5` "Bright 2BR Apartment", Apartment, Molo, ₱15,000 **rent**, 2bd/1ba, floor 55, "Verified owner", featured, "4 days ago".
  - `p7` "Starter Home near the Highway", House, Oton, ₱3,450,000 (was 3,750,000, `drop:'−8%'`), 2bd/1ba, "5 days ago".

### `AREAS` — 8 districts with counts
`Mandurriao (412 homes)`, `Jaro (286)`, `Molo (174)`, `La Paz (138)`, `Pavia (121)`, `Oton (96)`,
`Arevalo (77)`, `Santa Barbara (64)`. Shape `{ name, count }`.

### `PINS` / `DISTRICTS` — map coordinates
`PINS`: `{ id, x, y }` map marker positions for 8 listings. `DISTRICTS`: `{ name, x, y }` labels for
Jaro, La Paz, Mandurriao, Molo, City Proper, Arevalo.

### `BROKER` — single broker profile
`{ name:'Maria Santos', first:'Maria', prc:'0031482', bio:'...', stats:[{value,label}×4],
creds:[{k,v}×4], reviews:[{name,stars,text}×3] }`.
- stats: Listings 48, Clients 124, Rating 4.9, Experience 12y.
- creds: PRC licence=Verified, Government ID=Verified, Brokerage=Santos Realty, Replies in ~2 hours.
- 3 reviews (Jules R. ★★★★★, Anna & Paolo D. ★★★★★, Kim S. ★★★★☆).

### Constant lists
- `TYPES` = ['House','Condo','Apartment','Land','Commercial','Office','Townhouse']
- `LOCS` = ['Mandurriao','Jaro','Molo','La Paz','Arevalo','City Proper','Pavia','Oton','Santa Barbara']
- `FEATS` = ['Parking','Gated','Furnished','Clean title','Flood-free','Pet friendly']

### Image maps
`IMG` (p1–p14 → images/*.png), `GAL` (per-property galleries), `GAL_DEF` default gallery,
`AREA_IMG` (district → hero image). Notifications reference b9/a1/a6/a2.png directly.

---

## Divergent tokens (differ from the known palette set)

These colors/values appear in the second half and are NOT in the known token list; capture them:
- **`#3D3630`** — dark neutral for icon glyphs / secondary text on chips (back button, edit pill, presets).
- **`#5A524A`** — body text inside verify-sheet points / selected-off pill text.
- **`#7A7268`** — muted variant used for "or"/inactive tab text/notification meta and inactive nav labels.
- **`#EAE3D9`** — auth divider lines & inactive onboarding progress tick.
- **`#E6DFD4`** — settings toggle OFF track background.
- **`#E0D8CC`** — bottom-sheet drag handle.
- **`#A99E90`** — account row chevron `›` color.
- **`#EDF5F0`** — success-tint circle/badge background (pairs with success `#2F6B4F`).
- **`#1A1714`** used as an ON background for **segmented controls** (segStyle) and the sheet "Got it"
  button — i.e. dark selection state, distinct from the accent-selection used by pill chips.
- Radii: cards 20px (profile/hero), grouped-row cards 16px, inputs/buttons 14px, chips/pills 999px,
  notification rows 18px, bottom sheet `24px 24px 0 0`.
- Button min-heights: primary CTAs 54px, inputs 52px, pills 46px, tab items 60px, keypad keys 58px.
- `appIn` fade animation used across secondary screens (auth `.45s`, home `.5s`).
