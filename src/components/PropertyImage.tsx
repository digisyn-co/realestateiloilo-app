"use client";

import { useState } from "react";

/**
 * Property photo with a warm placeholder fallback. The prototype uses drop-target
 * photography; when a file is missing (or an imported image is not yet hosted) we
 * degrade to a tasteful sand gradient with an optional label instead of a broken img.
 */
export function PropertyImage({
  src,
  alt,
  className = "",
  placeholder,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  placeholder?: string;
}) {
  const [failed, setFailed] = useState(false);
  const show = src && !failed;
  return (
    <div className={`relative h-full w-full overflow-hidden bg-line-2 ${className}`}>
      {show ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src!}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div
          className="grid h-full w-full place-items-center"
          style={{ background: "linear-gradient(135deg,#F4EEE4 0%,#E9E0D2 55%,#E1D6C6 100%)" }}
        >
          <span className="px-3 text-center font-sans text-[11px] font-semibold uppercase tracking-wider text-muted-2">
            {placeholder || "Photograph"}
          </span>
        </div>
      )}
    </div>
  );
}
