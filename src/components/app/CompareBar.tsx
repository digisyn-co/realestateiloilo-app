"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GitCompare, X } from "lucide-react";
import { clearCompare, getCompare } from "@/lib/compare";

export function CompareBar() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const sync = () => setCount(getCompare().length);
    sync();
    window.addEventListener("compare-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("compare-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  if (count < 1) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-4 md:bottom-6">
      <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-ink px-3 py-2 pl-5 text-white shadow-pop">
        <GitCompare size={16} />
        <span className="font-sans text-[13.5px] font-semibold">{count} to compare</span>
        <Link href="/compare" className="rounded-full bg-accent px-4 py-2 font-sans text-[13px] font-semibold text-white">
          Compare
        </Link>
        <button onClick={clearCompare} aria-label="Clear compare" className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/10">
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
