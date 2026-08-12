"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  const router = useRouter();
  const sp = useSearchParams();
  if (totalPages <= 1) return null;

  function go(p: number) {
    const params = new URLSearchParams(sp.toString());
    params.set("page", String(p));
    router.push(`?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <button disabled={page <= 1} onClick={() => go(page - 1)} className="rounded-full bg-surface px-4 py-2.5 font-sans text-[13px] font-semibold text-ink-2 shadow-card disabled:opacity-40">
        ‹ Prev
      </button>
      <span className="px-3 font-sans text-[13px] font-medium text-muted">
        Page {page} of {totalPages}
      </span>
      <button disabled={page >= totalPages} onClick={() => go(page + 1)} className="rounded-full bg-surface px-4 py-2.5 font-sans text-[13px] font-semibold text-ink-2 shadow-card disabled:opacity-40">
        Next ›
      </button>
    </div>
  );
}
