import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { locationsByZip, type KrogerLocation } from "./kroger-client";

const DATA_DIR = process.env.STORES_DATA_DIR ? path.resolve(process.env.STORES_DATA_DIR) : path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "kroger.db");
const TTL_MS = 24 * 60 * 60 * 1000;
let db: Database | null = null;
function getDb() {
  if (!db) {
    mkdirSync(DATA_DIR, { recursive: true });
    db = new Database(DB_FILE);
    db.run(`CREATE TABLE IF NOT EXISTS kroger_stores (zip TEXT PRIMARY KEY, stores_json TEXT NOT NULL, fetched_at TEXT NOT NULL)`);
  }
  return db;
}
export type StoreSearch = { zip: string; stores: KrogerLocation[]; fetchedAt: string };

// Kroger's location feed can include internal logistics/forecast sites alongside
// customer-facing stores. Filter by name at this server-side boundary so these
// records never reach the public API or map; real store names (including names
// containing ordinary words such as "Kroger") remain eligible.
const INTERNAL_LOCATION_NAME = /forecast|spoke|shed|warehouse|unused|trans|dc\b|distribution/i;
function customerFacingStores(stores: KrogerLocation[]): KrogerLocation[] {
  return stores.filter((store) => !INTERNAL_LOCATION_NAME.test(store.name ?? ""));
}

export async function getStoresByZip(zip: string): Promise<StoreSearch> {
  const cached = getDb().query("SELECT stores_json, fetched_at FROM kroger_stores WHERE zip = ?").get(zip) as { stores_json: string; fetched_at: string } | null;
  if (cached && Date.now() - Date.parse(cached.fetched_at) < TTL_MS) {
    try {
      const rawStores = JSON.parse(cached.stores_json) as KrogerLocation[];
      const stores = customerFacingStores(rawStores);
      // Persist the sanitized cache too, so old cached logistics records are
      // removed even when no upstream refresh is needed.
      if (stores.length !== rawStores.length) {
        getDb().run("UPDATE kroger_stores SET stores_json = ? WHERE zip = ?", JSON.stringify(stores), zip);
      }
      return { zip, stores, fetchedAt: cached.fetched_at };
    } catch { /* refresh corrupt cache */ }
  }
  try {
    const stores = customerFacingStores(await locationsByZip(zip, 10));
    const fetchedAt = new Date().toISOString();
    getDb().run("INSERT INTO kroger_stores (zip, stores_json, fetched_at) VALUES (?, ?, ?) ON CONFLICT(zip) DO UPDATE SET stores_json=excluded.stores_json, fetched_at=excluded.fetched_at", zip, JSON.stringify(stores), fetchedAt);
    return { zip, stores, fetchedAt };
  } catch (error) {
    console.warn(`kroger stores lookup failed for ${zip}:`, error instanceof Error ? error.message : error);
    return { zip, stores: [], fetchedAt: new Date().toISOString() };
  }
}
