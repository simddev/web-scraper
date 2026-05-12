export function normalizeURL(urlString: string): string {
  const url = new URL(urlString);
  const normalized = url.host + url.pathname + url.search;
  return normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;
}
