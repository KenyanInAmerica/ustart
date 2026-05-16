// Safe in both client and server contexts — no Notion API calls here.

export function isNotionUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === "notion.so" || hostname === "www.notion.so";
  } catch {
    return false;
  }
}

// Matches /dashboard/content/(lite|explore|concierge)/<slug>
export function isUStartContentUrl(url: string): boolean {
  return /^\/dashboard\/content\/(lite|explore|concierge)\/[a-z0-9-]+$/.test(url);
}

// Notion page IDs are 32 lowercase hex characters. They appear at the end
// of the last URL path segment, optionally preceded by a slugified title and
// a hyphen (e.g. "Page-Title-abc123...").
export function extractNotionPageId(url: string): string | null {
  try {
    const { pathname } = new URL(url);
    const lastSegment = pathname.split("/").filter(Boolean).pop() ?? "";
    const match = lastSegment.match(/([a-f0-9]{32})$/i);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
