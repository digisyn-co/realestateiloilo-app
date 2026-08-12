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
  const src =
    variant === "mark" ? "/brand/mark.png" : variant === "horizontal" ? "/brand/logo-horizontal.png" : "/brand/logo.png";

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
