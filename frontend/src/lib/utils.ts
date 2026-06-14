// Small shared helpers.

/** Split a comma-separated string into a trimmed, de-duplicated, non-empty array. */
export function parseKeywords(input: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input.split(",")) {
    const k = raw.trim();
    if (k && !seen.has(k.toLowerCase())) {
      seen.add(k.toLowerCase());
      out.push(k);
    }
  }
  return out;
}

/** Turn a string OR string[] of keywords into a clean array (requests return a string). */
export function toKeywordArray(value: string | string[] | null | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return parseKeywords(value);
}

/** Relative time like "just now", "5m ago", "3h ago", "2d ago". */
export function timeAgo(iso?: string | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (isNaN(then)) return "";
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}

/** Friendly date like "13 Jun 2026". */
export function formatDate(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
