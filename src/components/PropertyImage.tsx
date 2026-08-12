"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Property photo with a warm placeholder fallback. Uses next/image so photos are
 * served as right-sized WebP/AVIF (fast, premium) instead of the multi-MB source.
 * When a file is missing (or an imported image isn't hosted yet) it degrades to a
 * tasteful sand gradient instead of a broken image.
 */
export function PropertyImage({
  src,
  alt,
  className = "",
  placeholder,
  sizes,
  priority,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  placeholder?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const show = src && !failed;
  return (
    <div className={`relative h-full w-full overflow-hidden bg-line-2 ${className}`}>
      {show ? (
        <Image
          src={src!}
          alt={alt}
          fill
          sizes={sizes || "(max-width: 768px) 100vw, 440px"}
          onError={() => setFailed(true)}
          className="object-cover"
        />
      ) : (
        <div
          className="grid h-full w-full place-items-center"
          style={{ background: "linear-gradient(135deg,#F4EEE1 0%,#E9E0CE 55%,#E1D6BF 100%)" }}
        >
          <span className="px-3 text-center font-sans text-[11px] font-semibold uppercase tracking-wider text-muted-2">
            {placeholder || "Photograph"}
          </span>
        </div>
      )}
    </div>
  );
}
