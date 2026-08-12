"use client";

import { useEffect } from "react";

/**
 * OneSignal push notifications — one component, both platforms:
 *  - Native (Capacitor iOS/Android): the OneSignal Cordova/Capacitor plugin.
 *  - Web (browsers): the OneSignal Web SDK v16 (service worker at
 *    /OneSignalSDKWorker.js).
 * The logged-in user is linked via OneSignal.login(userId) so pushes can be
 * targeted per user (fetched from /api/me, avoiding making the app SSR-dynamic).
 */
const APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || "64e5cdb3-eb9d-4d24-89a3-d22ee80ba228";

declare global {
  interface Window {
    OneSignalDeferred?: Array<(os: OneSignalWeb) => void | Promise<void>>;
  }
}
type OneSignalWeb = {
  init: (opts: { appId: string; allowLocalhostAsSecureOrigin?: boolean }) => Promise<void>;
  login: (externalId: string) => Promise<void>;
};

async function currentUserId(): Promise<string | null> {
  try {
    const res = await fetch("/api/me", { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()).userId ?? null;
  } catch {
    return null;
  }
}

export function OneSignalInit() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { Capacitor } = await import("@capacitor/core");

      // ---- Native (Capacitor) ----
      if (Capacitor.isNativePlatform()) {
        try {
          const mod = await import("onesignal-cordova-plugin");
          const OneSignal = (mod as { default?: OneSignalNative }).default ?? (mod as unknown as OneSignalNative);
          OneSignal.initialize(APP_ID);
          const uid = await currentUserId();
          if (uid && !cancelled) OneSignal.login(uid);
          // ask for permission (native prompt)
          OneSignal.Notifications.requestPermission(true).catch(() => {});
          // deep-link when a notification is tapped
          OneSignal.Notifications.addEventListener("click", (e: NativeClickEvent) => {
            const href = e?.notification?.additionalData?.href;
            if (typeof href === "string" && href.startsWith("/")) window.location.assign(href);
          });
        } catch {
          /* plugin unavailable */
        }
        return;
      }

      // ---- Web (browsers) ----
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      if (!document.getElementById("onesignal-sdk")) {
        const s = document.createElement("script");
        s.id = "onesignal-sdk";
        s.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
        s.defer = true;
        document.head.appendChild(s);
      }
      window.OneSignalDeferred.push(async (OneSignal) => {
        await OneSignal.init({ appId: APP_ID, allowLocalhostAsSecureOrigin: true });
        const uid = await currentUserId();
        if (uid) {
          try {
            await OneSignal.login(uid);
          } catch {}
        }
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

// Minimal shape of the native plugin surface we use.
type NativeClickEvent = { notification?: { additionalData?: { href?: string } } };
type OneSignalNative = {
  initialize: (appId: string) => void;
  login: (externalId: string) => void;
  Notifications: {
    requestPermission: (fallbackToSettings: boolean) => Promise<boolean>;
    addEventListener: (event: "click", cb: (e: NativeClickEvent) => void) => void;
  };
};
