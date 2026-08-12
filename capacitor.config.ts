import type { CapacitorConfig } from "@capacitor/cli";

/**
 * The Iloilo Real Estate — native mobile app (Capacitor 6).
 *
 * Strategy: the app is a server-rendered Next.js app, so the native shell loads
 * the hosted app over HTTPS (`server.url`) and layers native capabilities on top
 * (push, camera, geolocation, status bar, splash, hardware back). This reuses the
 * entire web app while shipping as real iOS/Android apps to the stores.
 *
 * The app opens directly into the buyer/renter experience — src/components/native/
 * NativeBridge.tsx redirects "/" -> "/browse" when running natively.
 *
 * To point at a custom domain later, change `server.url` + `allowNavigation`.
 * For local development on a device/simulator, set:
 *   server.url = "http://<your-LAN-ip>:3000"  and  server.cleartext = true
 */
const PROD_URL = "https://realestateiloilo-app.vercel.app";

const config: CapacitorConfig = {
  appId: "ph.realestateiloilo.app",
  appName: "The Iloilo Real Estate",
  webDir: "mobile/www", // offline/loading fallback bundled into the app
  server: {
    url: PROD_URL,
    allowNavigation: ["realestateiloilo-app.vercel.app"],
    cleartext: false,
    androidScheme: "https",
    iosScheme: "https",
  },
  backgroundColor: "#FAF6EC",
  ios: {
    contentInset: "always",
    backgroundColor: "#FAF6EC",
    limitsNavigationsToAppBoundDomains: false,
  },
  android: {
    backgroundColor: "#FAF6EC",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: false, // NativeBridge hides it once the web app is ready
      backgroundColor: "#FAF6EC",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashImmersive: false,
    },
    StatusBar: {
      style: "LIGHT", // dark text/icons on the light app background
      backgroundColor: "#FAF6EC",
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
