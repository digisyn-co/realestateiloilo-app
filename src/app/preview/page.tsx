"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * Online app preview — runs the real production apps inside a phone frame, so you
 * can see/share the mobile experience without building in Xcode/Android Studio.
 * Hosted on the same Vercel deployment: /preview.
 *
 * Two apps ship from this one codebase (see MOBILE.md), so the preview lets you
 * switch between them:
 *   • Consumer — "The Iloilo Real Estate" (buyers & renters) → opens /browse
 *   • Pro      — "Iloilo Real Estate Pro" (brokers/agents/developers) → opens /dashboard
 */
const DEVICES = {
  iphone: { label: "iPhone 15", w: 393, h: 852, radius: 54, island: true },
  pixel: { label: "Pixel 8", w: 412, h: 900, radius: 38, island: false },
} as const;

type DeviceKey = keyof typeof DEVICES;

const APPS = {
  consumer: {
    label: "Consumer app",
    sub: "Buyers & renters",
    start: "/browse",
    chips: [
      ["Home", "/browse"],
      ["Map", "/map"],
      ["AI search", "/ai"],
      ["A project", "/project/the-grand-iloilo-residences"],
      ["Saved", "/saved"],
      ["Account", "/account"],
    ] as const,
    note: null as string | null,
  },
  pro: {
    label: "Pro app",
    sub: "Brokers · agents · developers",
    start: "/dashboard",
    chips: [
      ["Dashboard", "/dashboard"],
      ["My listings", "/dashboard/listings"],
      ["My agents", "/dashboard/team"],
      ["Agent listings", "/dashboard/review"],
      ["Leads", "/dashboard/leads"],
      ["Developer portal", "/developer"],
      ["Projects", "/developer/projects"],
    ] as const,
    note: "The Pro app is sign-in only. Use the demo head broker — carla@ilonggorealty.ph / password123 — to see the agent-management + listing-approval flow.",
  },
} as const;

type AppKey = keyof typeof APPS;

export default function PreviewPage() {
  const [app, setApp] = useState<AppKey>("consumer");
  const [device, setDevice] = useState<DeviceKey>("iphone");
  const [start, setStart] = useState<string>(APPS.consumer.start);
  const [nonce, setNonce] = useState(0);
  const d = DEVICES[device];
  const a = APPS[app];

  const switchApp = (k: AppKey) => {
    setApp(k);
    setStart(APPS[k].start);
    setNonce((n) => n + 1);
  };

  return (
    <div className="min-h-screen bg-[#031A14] text-[#F4F0E6]" style={{ background: "radial-gradient(120% 90% at 50% 0%, #0C3226 0%, #05120C 60%)" }}>
      <header className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-4 px-6 py-5">
        <Link href="/" className="font-serif text-[22px] leading-none">
          The <span className="italic text-[#D6A84F]">Iloilo</span> Real Estate
        </Link>
        <span className="rounded-full border border-[#D6A84F]/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#D6A84F]">App preview</span>
        <div className="ml-auto flex items-center gap-2">
          {(Object.keys(DEVICES) as DeviceKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setDevice(k)}
              className={`rounded-full px-3.5 py-2 text-[12px] font-semibold transition-colors ${device === k ? "bg-[#D6A84F] text-[#031A14]" : "border border-[#245140] text-[#AABBB0] hover:text-[#F4F0E6]"}`}
            >
              {DEVICES[k].label}
            </button>
          ))}
          <a href={start} target="_blank" rel="noreferrer" className="rounded-full border border-[#245140] px-3.5 py-2 text-[12px] font-semibold text-[#AABBB0] hover:text-[#F4F0E6]">
            Open full app ↗
          </a>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1100px] flex-col items-center px-6 pb-16">
        {/* app switcher — the two apps that ship from this one codebase */}
        <div className="mb-5 inline-flex rounded-full border border-[#245140] bg-[#05120C]/60 p-1">
          {(Object.keys(APPS) as AppKey[]).map((k) => (
            <button
              key={k}
              onClick={() => switchApp(k)}
              className={`rounded-full px-5 py-2.5 text-left transition-colors ${app === k ? "bg-[#D6A84F] text-[#031A14]" : "text-[#AABBB0] hover:text-[#F4F0E6]"}`}
            >
              <span className="block text-[13px] font-bold leading-tight">{APPS[k].label}</span>
              <span className={`block text-[10.5px] leading-tight ${app === k ? "text-[#0B241A]/70" : "text-[#61796C]"}`}>{APPS[k].sub}</span>
            </button>
          ))}
        </div>

        <p className="mb-5 max-w-md text-center text-[13.5px] leading-relaxed text-[#AABBB0]">
          A live preview of the <span className="text-[#F4F0E6]">{a.label.toLowerCase()}</span> running the production build — exactly what ships to the App Store &amp; Google Play (via Capacitor).
        </p>

        {a.note && (
          <p className="mb-6 max-w-md rounded-2xl border border-[#D6A84F]/30 bg-[#D6A84F]/10 px-4 py-3 text-center text-[12.5px] leading-relaxed text-[#F3D38A]">
            {a.note}
          </p>
        )}

        {/* quick-jump chips (per app) */}
        <div className="mb-7 flex flex-wrap justify-center gap-2">
          {a.chips.map(([label, href]) => (
            <button
              key={href}
              onClick={() => { setStart(href); setNonce((n) => n + 1); }}
              className={`rounded-full px-3.5 py-2 text-[12px] font-semibold transition-colors ${start === href ? "bg-[#D6A84F] text-[#031A14]" : "border border-[#245140] text-[#AABBB0] hover:text-[#F4F0E6]"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* device frame */}
        <div
          className="relative bg-black shadow-[0_50px_120px_-20px_rgba(0,0,0,.7)]"
          style={{ width: d.w + 24, height: d.h + 24, borderRadius: d.radius + 12, padding: 12 }}
        >
          <div className="relative overflow-hidden" style={{ width: d.w, height: d.h, borderRadius: d.radius, background: "#031A14" }}>
            {/* status-bar area (matches the app's dark header) so the notch/island
                doesn't overlap the app content */}
            {d.island && (
              <div className="pointer-events-none absolute left-1/2 top-[10px] z-10 h-[28px] w-[112px] -translate-x-1/2 rounded-full bg-black" />
            )}
            <iframe
              key={`${app}-${device}-${start}-${nonce}`}
              src={start}
              title={`${a.label} preview`}
              className="border-0"
              style={{ width: d.w, height: d.h - (d.island ? 44 : 16), marginTop: d.island ? 44 : 16 }}
            />
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button onClick={() => setNonce((n) => n + 1)} className="rounded-full border border-[#245140] px-4 py-2 text-[12px] font-semibold text-[#AABBB0] hover:text-[#F4F0E6]">
            ↻ Reload
          </button>
          <span className="text-[12px] text-[#61796C]">Tip: resize your browser — it stays a phone.</span>
        </div>
      </div>
    </div>
  );
}
