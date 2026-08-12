import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-app px-6 text-center">
      <div>
        <div className="font-serif text-[64px] leading-none text-accent">404</div>
        <h1 className="mt-4 font-serif text-[28px] text-ink">We couldn't find that page.</h1>
        <p className="mx-auto mt-2 max-w-sm font-sans text-[14.5px] text-muted">The listing may have been removed, or the link is out of date.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/browse" className="btn-primary">Browse homes</Link>
          <Link href="/" className="btn-ghost">Go home</Link>
        </div>
      </div>
    </div>
  );
}
