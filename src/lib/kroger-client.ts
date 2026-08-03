// Server-only Kroger API client (OAuth2 client_credentials + Locations/Products).
//
// SERVER-ONLY — never import this module from client code. It reads API
// credentials and talks to api.kroger.com. Keep it out of any client import
// graph: the secret must never reach the browser bundle. All entry points that
// use it (API route handlers, CLI scripts) are server-side; TanStack Start
// strips `server` handlers from client output.
//
// Credentials: read from env KROGER_CLIENT_ID / KROGER_CLIENT_SECRET (Bun
// auto-loads .env from the site root), with a fallback to the team's shared
// credentials doc so CLI runs work out of the box. The secret is never exposed
// through any API route or page.
//
// Verified facts (2026-08-02, do not re-derive):
//   - Token: POST https://api.kroger.com/v1/connect/oauth2/token,
//     Content-Type: application/x-www-form-urlencoded,
//     Authorization: Basic base64(CLIENT_ID:CLIENT_SECRET),
//     body: grant_type=client_credentials&scope=product.compact
//   - Tokens expire after 1800 s; ONLY product.compact scope is valid for this app.
//   - Locations: GET /v1/locations?filter.zipCode.near=<zip>&filter.limit=<n>
//   - Products+prices: GET /v1/products?filter.term=<term>&filter.locationId=<id>&filter.limit=<n>
//     → items[].price.regular (e.g. Kroger 2% milk gallon $3.49), optional price.promo.
import { readFileSync } from "node:fs";

const TOKEN_URL = "https://api.kroger.com/v1/connect/oauth2/token";
const API_BASE = "https://api.kroger.com/v1";
const SCOPE = "product.compact";
const TOKEN_TTL_MS = 1_800_000; // verified: expires_in 1800 s
const REFRESH_EARLY_MS = 120_000; // treat as stale with 2 min of life left
export const REQUEST_DELAY_MS = 600; // politeness gap between API calls (rate limits)
const CREDENTIALS_DOC = "/home/team/shared/kroger-api-credentials.md";

type Credentials = { clientId: string; clientSecret: string };

function readCredentials(): Credentials {
  const clientId = process.env.KROGER_CLIENT_ID;
  const clientSecret = process.env.KROGER_CLIENT_SECRET;
  if (clientId && clientSecret) return { clientId, clientSecret };
  try {
    const text = readFileSync(CREDENTIALS_DOC, "utf8");
    const idMatch = text.match(/Client ID:\s*(\S+)/);
    const secMatch = text.match(/Client Secret:\s*(\S+)/);
    if (idMatch?.[1] && secMatch?.[1]) {
      return { clientId: idMatch[1], clientSecret: secMatch[1] };
    }
  } catch {
    // fall through to the error below
  }
  throw new Error(
    "Kroger credentials not configured: set KROGER_CLIENT_ID / KROGER_CLIENT_SECRET in .env (see .env.example).",
  );
}

let cachedToken: { token: string; expiresAt: number } | null = null;

/** OAuth2 client_credentials token, cached for its lifetime (1800 s). */
export async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - REFRESH_EARLY_MS) {
    return cachedToken.token;
  }
  const { clientId, clientSecret } = readCredentials();
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope: SCOPE,
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Kroger token request failed (HTTP ${res.status}): ${text.slice(0, 200)}`,
    );
  }
  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) {
    throw new Error("Kroger token response missing access_token");
  }
  const ttl = (data.expires_in ?? 1800) * 1000;
  cachedToken = { token: data.access_token, expiresAt: Date.now() + ttl };
  return cachedToken.token;
}

async function krogerFetch(path: string, init?: RequestInit): Promise<unknown> {
  const token = await getAccessToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Kroger API ${path} failed (HTTP ${res.status}): ${text.slice(0, 200)}`,
    );
  }
  return res.json();
}

export type KrogerLocation = {
  locationId: string;
  name: string | null;
  chain: string | null;
  addressLine1: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  hours: unknown;
  departments: unknown;
};

/** Stores near a zip code (Kroger /v1/locations). */
export async function locationsByZip(
  zip: string,
  limit = 2,
): Promise<KrogerLocation[]> {
  const data = (await krogerFetch(
    `/locations?filter.zipCode.near=${encodeURIComponent(zip)}&filter.limit=${limit}`,
  )) as { data?: unknown[] };
  const list = Array.isArray(data?.data) ? data.data : [];
  return list.map((l) => {
    const loc = l as {
      locationId?: unknown;
      name?: unknown;
      chain?: unknown;
      address?: {
        addressLine1?: unknown;
        city?: unknown;
        state?: unknown;
        zipCode?: unknown;
      };
      geolocation?: { latitude?: unknown; longitude?: unknown };
      phone?: unknown;
      hours?: unknown;
      departments?: unknown;
    };
    return {
      locationId: String(loc.locationId ?? ""),
      name: typeof loc.name === "string" ? loc.name : null,
      chain: typeof loc.chain === "string" ? loc.chain : null,
      addressLine1:
        typeof loc.address?.addressLine1 === "string"
          ? loc.address.addressLine1
          : null,
      city: typeof loc.address?.city === "string" ? loc.address.city : null,
      state: typeof loc.address?.state === "string" ? loc.address.state : null,
      zipCode:
        typeof loc.address?.zipCode === "string" ? loc.address.zipCode : null,
      lat: typeof loc.geolocation?.latitude === "number" ? loc.geolocation.latitude : null,
      lng: typeof loc.geolocation?.longitude === "number" ? loc.geolocation.longitude : null,
      phone: typeof loc.phone === "string" ? loc.phone : null,
      hours: loc.hours ?? null,
      departments: loc.departments ?? null,
    };
  });
}

export type KrogerProduct = {
  description: string;
  size: string | null;
  priceRegular: number | null;
  pricePromo: number | null;
};

/**
 * Product search with store-level prices for a fulfillment location
 * (Kroger /v1/products). Returns only products that have a first item, with
 * price.regular and any price.promo normalized to numbers.
 */
export async function productPrices(
  searchTerm: string,
  locationId: string,
  limit = 5,
): Promise<KrogerProduct[]> {
  const data = (await krogerFetch(
    `/products?filter.term=${encodeURIComponent(searchTerm)}&filter.locationId=${encodeURIComponent(locationId)}&filter.limit=${limit}`,
  )) as { data?: unknown[] };
  const list = Array.isArray(data?.data) ? data.data : [];
  const products: KrogerProduct[] = [];
  for (const p of list) {
    const prod = p as {
      description?: unknown;
      items?: Array<{ size?: unknown; price?: unknown }>;
    };
    const item = Array.isArray(prod.items) && prod.items.length > 0 ? prod.items[0] : null;
    if (!item) continue;
    const price = (item.price ?? {}) as {
      regular?: unknown;
      promo?: unknown;
    };
    // promo can be a number, or an object { price } / { regular }.
    let promo: number | null = null;
    if (typeof price.promo === "number") promo = price.promo;
    else if (typeof price.promo === "object" && price.promo !== null) {
      const pObj = price.promo as { price?: unknown; regular?: unknown };
      if (typeof pObj.price === "number") promo = pObj.price;
      else if (typeof pObj.regular === "number") promo = pObj.regular;
    }
    products.push({
      description:
        typeof prod.description === "string" ? prod.description : "Unknown item",
      size: typeof item.size === "string" && item.size ? item.size : null,
      priceRegular: typeof price.regular === "number" ? price.regular : null,
      pricePromo: promo,
    });
  }
  return products;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
