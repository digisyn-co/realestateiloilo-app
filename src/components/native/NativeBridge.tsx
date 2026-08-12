"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Native integration layer (Capacitor). Runs on every page but only does anything
 * when the app is running inside the native iOS/Android shell — on the web it is a
 * no-op. Wires: splash hide, status bar, hardware back (Android), external links in
 * the system browser, "open into the buyer app", and push-notification registration.
 *
 * All Capacitor imports are dynamic so they never run during SSR / on the server.
 */
/**
 * True when running inside the Pro native shell (broker/agent/developer app).
 * capacitor.config.ts appends "IloiloRealEstatePro" to the WebView User-Agent for
 * the Pro flavor; the consumer app appends "IloiloRealEstate" (no "Pro").
 */
function isProApp() {
  if (typeof navigator === "undefined") return false;
  return /IloiloRealEstatePro/.test(navigator.userAgent);
}

export function NativeBridge() {
  const router = useRouter();
  const pathname = usePathname();

  // Open the app directly into the right experience for the flavor:
  //   • Pro app (broker/agent/developer) → /dashboard
  //   • Consumer app (buyers/renters)    → /browse
  // The two flavors are told apart by the appended User-Agent token set in
  // capacitor.config.ts (CAP_FLAVOR=pro appends "IloiloRealEstatePro").
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) return;
      if (cancelled) return;
      if (pathname === "/") router.replace(isProApp() ? "/dashboard" : "/browse");
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    (async () => {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) return;

      // ---- Splash + status bar ----
      try {
        const { SplashScreen } = await import("@capacitor/splash-screen");
        await SplashScreen.hide();
      } catch {}
      try {
        const { StatusBar, Style } = await import("@capacitor/status-bar");
        const pro = isProApp();
        // Pro app rides the dark forest-green dashboard; consumer app is light ivory.
        await StatusBar.setStyle({ style: pro ? Style.Dark : Style.Light });
        if (Capacitor.getPlatform() === "android") {
          await StatusBar.setBackgroundColor({ color: pro ? "#031A14" : "#FBF8F3" });
        }
      } catch {}

      // ---- Android hardware back button ----
      let backHandle: { remove: () => void } | undefined;
      try {
        const { App } = await import("@capacitor/app");
        const sub = await App.addListener("backButton", ({ canGoBack }) => {
          if (canGoBack || window.history.length > 1) window.history.back();
          else App.exitApp();
        });
        backHandle = sub;
      } catch {}

      // ---- Open external links in the system browser (don't trap in the WebView) ----
      const onClick = async (e: MouseEvent) => {
        const a = (e.target as HTMLElement)?.closest?.("a") as HTMLAnchorElement | null;
        if (!a?.href) return;
        try {
          const url = new URL(a.href);
          if (url.origin !== window.location.origin && /^https?:$/.test(url.protocol)) {
            e.preventDefault();
            const { Browser } = await import("@capacitor/browser");
            await Browser.open({ url: a.href });
          }
        } catch {}
      };
      document.addEventListener("click", onClick, true);

      // Push notifications are handled by OneSignal (see OneSignalInit.tsx).

      cleanup = () => {
        backHandle?.remove();
        document.removeEventListener("click", onClick, true);
      };
    })();
    return () => cleanup?.();
  }, []);

  return null;
}

