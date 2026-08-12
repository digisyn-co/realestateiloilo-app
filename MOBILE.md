# Real Estate Iloilo — Native Mobile Apps (iOS + Android)

The consumer (buyer/renter) experience ships to the **App Store** and **Google Play**
as native apps via **Capacitor 6**. Brokers, developers, and admins continue to use
the responsive web dashboards.

## How it works (architecture)

The app is a server-rendered Next.js app, so the native shell **loads the hosted
app over HTTPS** (`server.url` in `capacitor.config.ts`) and layers native
capabilities on top — this reuses 100% of the web app while shipping as real
native apps. When launched natively, `src/components/native/NativeBridge.tsx`:

- opens directly into the buyer app (`/` → `/browse`),
- hides the native splash once the app is ready and sets the status bar,
- handles the Android hardware back button,
- opens external links in the system browser (not trapped in the WebView),
- registers the device for push and posts the token to `/api/push/register`.

Native permission strings are set in `ios/App/App/Info.plist` and
`android/app/src/main/AndroidManifest.xml` (camera, photos, location, notifications).

## Prerequisites (on a Mac)

| Tool | For | Install |
|---|---|---|
| **Xcode** (full, not just CLT) | iOS build/sign/submit | Mac App Store |
| **CocoaPods** | iOS native deps | `sudo gem install cocoapods` or `brew install cocoapods` |
| **Android Studio** + JDK 17 | Android build/sign/submit | developer.android.com / `brew install --cask android-studio temurin@17` |
| **Apple Developer Program** | App Store ($99/yr) | developer.apple.com |
| **Google Play Developer** | Play Store ($25 once) | play.google.com/console |

> This project was scaffolded on a machine with only Xcode Command Line Tools, so the
> final compile/sign/submit steps are run by you on a fully set-up Mac. Everything
> else (config, native code, permissions, both platform projects) is already done.

## First-time setup

```bash
npm install
# The ios/ and android/ projects are committed. Install iOS pods (needs CocoaPods):
cd ios/App && pod install && cd ../..
# Generate app icons + splash from assets/logo.svg (needs sharp):
npm install -D @capacitor/assets
npm run mobile:icons
# Sync web config into the native projects:
npm run cap:sync
```

## Build & run

```bash
npm run cap:ios       # opens Xcode  → pick a simulator/device → Run (▶)
npm run cap:android   # opens Android Studio → Run
```

- **iOS submit:** in Xcode, set your Team + a unique bundle id (default
  `ph.realestateiloilo.app`), then Product → Archive → Distribute App → App Store Connect.
- **Android submit:** in Android Studio, Build → Generate Signed Bundle (`.aab`),
  upload to the Play Console.

## Point at your own domain

When you move to a custom domain, edit `capacitor.config.ts`:

```ts
server: { url: "https://app.realestateiloilo.ph", allowNavigation: ["app.realestateiloilo.ph"] }
```

then `npm run cap:sync` and rebuild.

## Local development on a device

Point the app at your dev server instead of production:

```ts
// capacitor.config.ts
server: { url: "http://<your-LAN-ip>:3000", cleartext: true }
```

Run `npm run dev`, `npm run cap:sync`, then run from Xcode/Android Studio.

## Push notifications — remaining setup

Client registration is wired (`NativeBridge` → `/api/push/register`, stored in the
`PushDevice` table). To actually **deliver** pushes you still need:

1. **iOS:** an APNs key in your Apple Developer account; enable the Push
   Notifications capability in Xcode.
2. **Android:** a Firebase project; drop `google-services.json` into
   `android/app/` and add the FCM plugin config.
3. **A server sender:** send to stored tokens on events (new inquiry, listing
   approved, reservation, price drop) — the in-app `Notification` model already
   records these; add a sender that fans them out to APNs/FCM.

Set the relevant keys via env (see `.env.example`), keep them out of the repo.

## App Store review note

Apple rejects apps that are "just a website" (Guideline 4.2). This app clears that
bar because it adds real native value — push notifications, camera for listing
photos, GPS for the map, and native navigation. Make sure at least push + one of
camera/location are enabled and demonstrated in the build you submit.
