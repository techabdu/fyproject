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
