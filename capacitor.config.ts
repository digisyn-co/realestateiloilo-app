import type { CapacitorConfig } from "@capacitor/cli";

/**
 * The Iloilo Real Estate — native mobile apps (Capacitor 6).
 *
 * ONE web codebase, TWO store apps, selected at build time via `CAP_FLAVOR`:
 *
 *   • consumer (default) — "The Iloilo Real Estate"  → opens into /browse (buyers & renters)
 *   • pro     (CAP_FLAVOR=pro) — "Iloilo Real Estate Pro" → opens into /dashboard
 *                                (brokers, agents, developers)
 *
 * Both are thin native shells that load the hosted Next.js app over HTTPS
 * (`server.url`) and layer native capabilities on top (push, camera, geolocation,
 * status bar, splash, hardware back). The Pro flavor lives in its own native
 * project folders (ios-pro/, android-pro/) so the two apps build independently.
 *
 * Build the Pro app:
 *   CAP_FLAVOR=pro npx cap add ios      # first time — scaffolds ios-pro/
 *   CAP_FLAVOR=pro npx cap add android  # first time — scaffolds android-pro/
 *   CAP_FLAVOR=pro npx cap sync
 * (npm run cap:pro:* wrap these.)
 *
 * The web app tells the two apart at runtime via the appended User-Agent token
 * ("IloiloRealEstatePro"); see src/components/native/NativeBridge.tsx.
 */
const PROD_URL = "https://realestateiloilo-app.vercel.app";
const HOST = "realestateiloilo-app.vercel.app";

const isPro = process.env.CAP_FLAVOR === "pro";

// Per-flavor identity + theming. Consumer is light (ivory); Pro matches the dark
// forest-green dashboard so the splash/status bar don't flash a light background.
const flavor = isPro
  ? {
      appId: "ph.realestateiloilo.pro",
      appName: "Iloilo Real Estate Pro",
      bg: "#031A14", // dark dashboard background
      splashBg: "#031A14",
      splashBgDark: "#050706",
      statusBarStyle: "DARK" as const, // dark bar background → light icons
      statusBarBg: "#031A14",
      ua: "IloiloRealEstatePro",
      iosPath: "ios-pro",
      androidPath: "android-pro",
    }
  : {
      appId: "ph.realestateiloilo.app",
      appName: "The Iloilo Real Estate",
      bg: "#F4F0E6", // light ivory app background
      splashBg: "#F4F0E6",
      splashBgDark: "#050706",
      statusBarStyle: "LIGHT" as const, // light bar background → dark icons
      statusBarBg: "#F4F0E6",
      ua: "IloiloRealEstate",
      iosPath: "ios",
      androidPath: "android",
    };

const config: CapacitorConfig = {
  appId: flavor.appId,
  appName: flavor.appName,
  webDir: "mobile/www", // offline/loading fallback bundled into the app
  appendUserAgent: flavor.ua, // lets the web app detect which flavor is running
  server: {
    url: PROD_URL,
    allowNavigation: [HOST],
    cleartext: false,
    androidScheme: "https",
    iosScheme: "https",
  },
  backgroundColor: flavor.bg,
  ios: {
    path: flavor.iosPath,
    contentInset: "always",
    backgroundColor: flavor.bg,
    limitsNavigationsToAppBoundDomains: false,
  },
  android: {
    path: flavor.androidPath,
    backgroundColor: flavor.bg,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: false, // NativeBridge hides it once the web app is ready
      backgroundColor: flavor.splashBg,
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashImmersive: false,
    },
    StatusBar: {
      style: flavor.statusBarStyle,
      backgroundColor: flavor.statusBarBg,
    },
    Keyboard: {
      resize: "native",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
