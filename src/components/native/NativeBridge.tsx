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
export function NativeBridge() {
  const router = useRouter();
  const pathname = usePathname();

  // Open the app directly into the buyer experience (brief: app = buyers/renters).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) return;
      if (cancelled) return;
      if (pathname === "/") router.replace("/browse");
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
        await StatusBar.setStyle({ style: Style.Light }); // dark icons on light bg
        if (Capacitor.getPlatform() === "android") {
          await StatusBar.setBackgroundColor({ color: "#FBF8F3" });
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

      // ---- Push notifications (best-effort; needs APNs/FCM creds to deliver) ----
      registerPush().catch(() => {});

      cleanup = () => {
        backHandle?.remove();
        document.removeEventListener("click", onClick, true);
      };
    })();
    return () => cleanup?.();
  }, []);

  return null;
}

/**
 * Registers the device for push. Requesting permission + registering is safe to
 * call even before the backend/credentials exist; delivery only works once APNs
 * (iOS) and FCM (Android) are configured and a server sends to the token. The
 * token is posted to /api/push/register so the backend can store it later.
 */
async function registerPush() {
  const { Capacitor } = await import("@capacitor/core");
  if (!Capacitor.isNativePlatform()) return;
  let PushNotifications: typeof import("@capacitor/push-notifications").PushNotifications;
  try {
    ({ PushNotifications } = await import("@capacitor/push-notifications"));
  } catch {
    return;
  }
  const perm = await PushNotifications.checkPermissions();
  let status = perm.receive;
  if (status === "prompt") status = (await PushNotifications.requestPermissions()).receive;
  if (status !== "granted") return;

  await PushNotifications.addListener("registration", async (token) => {
    try {
      await fetch("/api/push/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.value, platform: Capacitor.getPlatform() }),
      });
    } catch {}
  });
  await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
    const href = action.notification?.data?.href;
    if (typeof href === "string" && href.startsWith("/")) window.location.assign(href);
  });
  await PushNotifications.register();
}
