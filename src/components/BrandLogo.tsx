"use client";

import { useState } from "react";

/**
 * Renders the real brand logo from /public/brand once it's added:
 *   - variant="full" → /brand/logo.png  (the full vertical lockup — auth, hero, splash)
 *   - variant="mark" → /brand/mark.png  (the LR monogram — headers, app icon)
 * Until the file exists (or if it fails to load) it degrades to the text wordmark,
 * so there is never a broken image.
 */
export function BrandLogo({
  variant = "full",
  width,
  className = "",
  textClassName = "",
}: {
  variant?: "full" | "mark" | "horizontal";
  width?: number;
  className?: string;
  textClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  // bump BRAND_V whenever a logo file's contents change (same filename) so
  // browsers/CDN don't serve a stale cached image.
  const BRAND_V = "3";
  const base =
    variant === "mark" ? "/brand/mark.png" : variant === "horizontal" ? "/brand/logo-horizontal.png" : "/brand/logo.png";
  const src = `${base}?v=${BRAND_V}`;

  if (failed) {
    return (
      <span className={`font-serif leading-none ${textClassName}`}>
        The <span className="italic text-accent">Iloilo</span> Real Estate
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="The Iloilo Real Estate"
      onError={() => setFailed(true)}
      className={className}
      style={width ? { width, height: "auto" } : undefined}
    />
  );
}
