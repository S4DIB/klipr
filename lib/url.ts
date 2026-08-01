/**
 * Make a user-typed link usable: prepend `https://` when the scheme is omitted,
 * so "youtube.com/@x" and "www.tiktok.com/…" work the same as a full URL. An
 * explicit http:// or https:// is left untouched. For web-link inputs only.
 */
export function normalizeUrl(input: string): string {
  const s = input.trim();
  if (!s) return "";
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}
