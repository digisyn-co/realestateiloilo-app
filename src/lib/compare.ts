// Client-side compare list (brief §4: compare properties). Stored in localStorage
// so it works without an account; the /compare page reads these ids.

const KEY = "rei_compare";
const MAX = 3;

export function getCompare(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function addToCompare(id: string): string[] {
  const list = getCompare().filter((x) => x !== id);
  list.unshift(id);
  const next = list.slice(0, MAX);
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("compare-change"));
  if (list.length >= MAX) {
    // still fine; we trimmed
  }
  return next;
}

export function removeFromCompare(id: string): string[] {
  const next = getCompare().filter((x) => x !== id);
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("compare-change"));
  return next;
}

export function clearCompare() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("compare-change"));
}
