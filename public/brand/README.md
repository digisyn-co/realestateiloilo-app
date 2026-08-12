# Brand assets

Drop the real logo files here and they appear automatically across the app
(auth screens, and anywhere `<BrandLogo />` is used). Until they exist, the app
shows the text wordmark — so nothing breaks.

| File | What | Best format |
|---|---|---|
| `logo.png` | Full vertical lockup (monogram + "THE ILOILO REAL ESTATE") | **Transparent PNG**, ~1200px wide |
| `mark.png` | Just the gold **LR monogram** (bridge + waves), square | **Transparent PNG**, 1024×1024 |
| `icon.png` | App-store icon: the monogram on a **navy** background, square | PNG, 1024×1024 (no transparency) |

Transparent backgrounds matter — the logo sits on cream (app) and navy
(marketing/dark) surfaces, so a white box would look wrong.

After adding files:
- In-app logos update on the next deploy.
- App icon: run `npm i -D @capacitor/assets && npm run mobile:icons` (uses
  `assets/logo.svg` by default — point it at `public/brand/icon.png` or replace
  `assets/logo.svg`), then `npm run cap:sync`.
