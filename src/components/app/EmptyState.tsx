import Link from "next/link";

export function EmptyState({
  title,
  body,
  actionLabel,
  actionHref,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="mx-auto max-w-md rounded-xl2 bg-surface p-11 text-center shadow-card">
      <div className="mb-3 font-serif text-[26px] leading-tight text-ink">{title}</div>
      <p className="mb-6 font-sans text-[14.5px] leading-relaxed text-muted">{body}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn-primary w-full">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
