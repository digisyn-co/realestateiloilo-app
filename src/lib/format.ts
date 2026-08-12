// Peso formatting + human helpers. Prices use tabular-nums in the UI.

export function formatPeso(amount: number, opts: { compact?: boolean } = {}): string {
  if (opts.compact) return compactPeso(amount);
  return "₱" + Math.round(amount).toLocaleString("en-PH");
}

/** ₱8.9M / ₱950K style, matching the prototype's map pins & drops. */
export function compactPeso(amount: number): string {
  if (amount >= 1_000_000) {
    const m = amount / 1_000_000;
    return "₱" + (Number.isInteger(m) ? m.toFixed(0) : m.toFixed(1).replace(/\.0$/, "")) + "M";
  }
  if (amount >= 1_000) {
    const k = amount / 1_000;
    return "₱" + (Number.isInteger(k) ? k.toFixed(0) : k.toFixed(1).replace(/\.0$/, "")) + "K";
  }
  return "₱" + Math.round(amount).toLocaleString("en-PH");
}

export function pricePerSqm(price: number, area?: number | null): string | null {
  if (!area || area <= 0) return null;
  return "₱" + Math.round(price / area).toLocaleString("en-PH") + "/sqm";
}

export function formatArea(sqm?: number | null): string | null {
  if (!sqm) return null;
  return `${Math.round(sqm).toLocaleString("en-PH")} sqm`;
}

export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const secs = Math.floor((Date.now() - d.getTime()) / 1000);
  const map: [number, string][] = [
    [60, "just now"],
    [3600, "m"],
    [86400, "h"],
    [604800, "d"],
    [2629800, "w"],
  ];
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  if (secs < 604800) return `${Math.floor(secs / 86400)}d ago`;
  if (secs < 2629800) return `${Math.floor(secs / 604800)}w ago`;
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
}
