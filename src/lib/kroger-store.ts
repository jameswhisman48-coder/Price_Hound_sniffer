// Server-only Kroger price cache + refresh orchestration.
//
// SERVER-ONLY. Uses bun:sqlite (Bun's built-in SQLite — zero extra deps) with a
// local DB file at <site>/data/kroger.db, mirroring the waitlist/analytics store
// patterns. Never import this module from client code; all entry points (API
// route handlers, CLI scripts) are server-side.
//
// Storage anchoring: process.cwd() is the site root in every supported path
// (publish.sh cd's to the site root before launching the server; `bun run`
// scripts execute with cwd = package root). import.meta.dir would point into
// dist/server/assets after bundling and silently split storage paths between
// server and CLI.
//
// LOCAL DISK storage for the pilot phase only — swap to a real database before
// any production go-live (serverless hosts do not persist file writes).
import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import {
  REQUEST_DELAY_MS,
  delay,
  locationsByZip,
  productPrices,
  type KrogerProduct,
} from "./kroger-client";
import { KROGER_ITEMS, type KrogerItem } from "./kroger-items";
import { PILOT_ZIP } from "./pilot-config";

const DATA_DIR = process.env.PRICES_DATA_DIR
  ? path.resolve(process.env.PRICES_DATA_DIR)
  : path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "kroger.db");

// Known-good fallback for the pilot metro (verified 2026-08-02) — used only if
// the locations API is unreachable, so a refresh still writes to the right
// store instead of failing outright.
const FALLBACK_LOCATION = {
  id: "01400513",
  label: "Kroger — 100 E Court St, Cincinnati, OH 45202",
};

let db: Database | null = null;

function getDb(): Database {
  if (!db) {
    mkdirSync(DATA_DIR, { recursive: true });
    db = new Database(DB_FILE);
    db.run(`
      CREATE TABLE IF NOT EXISTS kroger_prices (
        item_key TEXT PRIMARY KEY,
        description TEXT NOT NULL,
        price_regular REAL,
        price_promo REAL,
        location_id TEXT NOT NULL,
        fetched_at TEXT NOT NULL
      )
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS kroger_meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);
  }
  return db;
}

function getMeta(d: Database): Record<string, string> {
  const rows = d
    .query("SELECT key, value FROM kroger_meta")
    .all() as { key: string; value: string }[];
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

function setMeta(d: Database, key: string, value: string): void {
  d.run(
    "INSERT INTO kroger_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    key,
    value,
  );
}

export type KrogerPriceRow = {
  itemKey: string;
  label: string;
  description: string;
  priceRegular: number | null;
  pricePromo: number | null;
  locationId: string;
  fetchedAt: string;
};

export type KrogerPricesSummary = {
  prices: KrogerPriceRow[];
  fetchedAt: string | null;
  locationId: string | null;
  locationLabel: string | null;
  count: number;
};

/** Read the cached snapshot (never touches the Kroger API). */
export function getKrogerPricesSummary(): KrogerPricesSummary {
  const d = getDb();
  const meta = getMeta(d);
  const rows = d
    .query(
      "SELECT item_key, description, price_regular, price_promo, location_id, fetched_at FROM kroger_prices ORDER BY item_key",
    )
    .all() as {
    item_key: string;
    description: string;
    price_regular: number | null;
    price_promo: number | null;
    location_id: string;
    fetched_at: string;
  }[];
  const labelByKey = new Map(KROGER_ITEMS.map((i) => [i.itemKey, i.label]));
  const prices: KrogerPriceRow[] = rows.map((r) => ({
    itemKey: r.item_key,
    label: labelByKey.get(r.item_key) ?? r.item_key,
    description: r.description,
    priceRegular: r.price_regular,
    pricePromo: r.price_promo,
    locationId: r.location_id,
    fetchedAt: r.fetched_at,
  }));
  return {
    prices,
    fetchedAt: meta.fetched_at ?? null,
    locationId: meta.location_id ?? prices[0]?.locationId ?? null,
    locationLabel: meta.location_label ?? null,
    count: prices.length,
  };
}

/**
 * Pick the best product for a curated item out of the API results: rank priced
 * candidates by how many `match` keywords appear in the description, tie-broken
 * by API result order. Null when nothing has a price.
 */
function pickBestProduct(
  products: KrogerProduct[],
  item: KrogerItem,
): KrogerProduct | null {
  const priced = products.filter((p) => typeof p.priceRegular === "number");
  if (priced.length === 0) return null;
  const scored = priced
    .map((p, index) => {
      const desc = p.description.toLowerCase();
      const matchCount = item.match.filter((kw) => desc.includes(kw)).length;
      return { p, score: matchCount * 1000 - index };
    })
    .sort((a, b) => b.score - a.score);
  return scored[0].p;
}

/** Resolve the pilot store via the locations API; fall back to the known store. */
async function resolvePilotLocation(): Promise<{ id: string; label: string }> {
  try {
    const locs = await locationsByZip(PILOT_ZIP, 2);
    const kroger = locs.find((l) => l.chain?.toUpperCase() === "KROGER") ?? locs[0];
    if (kroger?.locationId) {
      const address = [
        kroger.addressLine1,
        [kroger.city, kroger.state].filter(Boolean).join(", "),
        kroger.zipCode,
      ]
        .filter(Boolean)
        .join(", ");
      // The API store name can be noisy ("Kroger - Kroger On the Rhine"); use
      // the chain + address for a clean, stable label.
      const chainName = kroger.chain?.toUpperCase() === "KROGER" ? "Kroger" : kroger.name ?? "Kroger";
      return {
        id: kroger.locationId,
        label: `${chainName} — ${address}`,
      };
    }
  } catch (err) {
    console.warn(
      `kroger: locationsByZip(${PILOT_ZIP}) failed, using fallback location: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }
  return FALLBACK_LOCATION;
}

export type RefreshResult = {
  updated: number;
  failed: { itemKey: string; error: string }[];
  locationId: string;
  locationLabel: string;
  fetchedAt: string;
  items: KrogerPriceRow[];
};

/**
 * Fetch live prices for every curated item at the pilot store and upsert the
 * cache. Each item lookup is spaced by REQUEST_DELAY_MS to stay under Kroger's
 * rate limits. Items that fail keep their previous cached row (if any).
 */
export async function refreshKrogerPrices(): Promise<RefreshResult> {
  const d = getDb();
  const location = await resolvePilotLocation();
  const fetchedAt = new Date().toISOString();
  const failed: { itemKey: string; error: string }[] = [];
  let updated = 0;

  for (const item of KROGER_ITEMS) {
    try {
      const products = await productPrices(item.searchTerm, location.id, 5);
      const best = pickBestProduct(products, item);
      if (best) {
        const description = best.size
          ? `${best.description} (${best.size})`
          : best.description;
        d.run(
          `INSERT INTO kroger_prices (item_key, description, price_regular, price_promo, location_id, fetched_at)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT(item_key) DO UPDATE SET
             description = excluded.description,
             price_regular = excluded.price_regular,
             price_promo = excluded.price_promo,
             location_id = excluded.location_id,
             fetched_at = excluded.fetched_at`,
          item.itemKey,
          description,
          best.priceRegular,
          best.pricePromo,
          location.id,
          fetchedAt,
        );
        updated += 1;
      } else {
        failed.push({ itemKey: item.itemKey, error: "No priced result found" });
      }
    } catch (err) {
      failed.push({
        itemKey: item.itemKey,
        error: err instanceof Error ? err.message : String(err),
      });
    }
    await delay(REQUEST_DELAY_MS);
  }

  setMeta(d, "location_id", location.id);
  setMeta(d, "location_label", location.label);
  setMeta(d, "fetched_at", fetchedAt);

  return {
    updated,
    failed,
    locationId: location.id,
    locationLabel: location.label,
    fetchedAt,
    items: getKrogerPricesSummary().prices,
  };
}
