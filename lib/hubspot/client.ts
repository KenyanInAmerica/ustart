// Server-side only — never import from client components.
// HubSpot API key must not reach the browser.

export function getHubSpotApiKey(): string {
  const key = process.env.HUBSPOT_API_KEY;
  if (!key) throw new Error("HUBSPOT_API_KEY not set");
  return key;
}

export function getHubSpotEnvironment(): string {
  return process.env.HUBSPOT_ENVIRONMENT ?? "staging";
}

export async function hubspotFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const key = getHubSpotApiKey();
  const url = `https://api.hubapi.com${path}`;

  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}
