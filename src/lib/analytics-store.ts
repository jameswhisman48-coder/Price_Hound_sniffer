// Server-only analytics storage (first-party, anonymous). Uses bun:sqlite
// (Bun's built-in SQLite — zero extra dependencies) with a local DB file at
// <site>/data/analytics.db.
//
// PRIVACY: we intentionally store only
//   - event type ("pageview" | "zip_demo_complete" | "waitlist_signup" |
//     "pilot_link_click")
//   - an anonymous visitor id (a random UUID generated once per browser and
//     kept in localStorage under "ph_vid" — no cookies, no fingerprinting)
//   - an optional zip code (only sent when the visitor chose to run the demo,
//     sign up, or click a pilot chain link)
//   - an optional chain slug (only for pilot_link_click — which store's ad
//     page the visitor opened; a low-sensitivity aggregate signal)
//   - a server timestamp
// No IPs, no user agents, no email addresses, no third-party scripts, no
// cross-site tracking. The events table holds no personal data; it exists to
// measure the pre-launch product KPIs (unique visitors, pageviews, zip-demo
// completions, waitlist signups, searched zips).
//
// WARNING:
// - SERVER-ONLY. bun:sqlite does not exist in the browser — never import this
//   module from client code.
// - LOCAL DISK storage for the pre-launch demand-validation phase only. Swap it
//   for a real database (the team's Neon DATABASE_URL via ~/db) before any
//   production go-live — serverless hosts (Vercel) do not persist file writes.
import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";

// Same anchoring rule as waitlist-store.ts: process.cwd() is the site root in
// every supported path (publish.sh cd's to the site root before launching the
// server; `bun run` scripts execute with cwd = package root). import.meta.dir
// would point into dist/server/assets after bundling and silently split
// storage paths between server and CLI.
const DATA_DIR = process.env.WAITLIST_DATA_DIR
  ? path.resolve(process.env.WAITLIST_DATA_DIR)
  : path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "analytics.db");

export const EVENT_TYPES = [
  "pageview",
  "zip_demo_complete",
  "waitlist_signup",
  "beta_signup",
  "pilot_link_click",
  "pet_link_click",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

let db: Database | null = null;

function getDb(): Database {
  if (!db) {
    mkdirSync(DATA_DIR, { recursive: true });
    db = new Database(DB_FILE);
    db.run(`
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        visitor_id TEXT,
        zip TEXT,
        chain TEXT,
        created_at TEXT NOT NULL
      )
    `);
    // Migrate pre-existing DBs that predate the chain column (SQLite has no
    // "ADD COLUMN IF NOT EXISTS" — duplicate-column errors are swallowed).
    try {
      db.run(`ALTER TABLE events ADD COLUMN chain TEXT`);
    } catch {
      // column already exists
    }
  }
  return db;
}

export function recordEvent(
  type: EventType,
  visitorId: string | null,
  zip: string | null,
  chain: string | null = null,
): void {
  const d = getDb();
  d.run(
    "INSERT INTO events (type, visitor_id, zip, chain, created_at) VALUES (?, ?, ?, ?, ?)",
    type,
    visitorId,
    zip,
    chain,
    new Date().toISOString(),
  );
}

export type PilotChainCount = {
  chain: string;
  zip: string | null;
  count: number;
};

export type AnalyticsSummary = {
  uniqueVisitors: number;
  pageviews: number;
  zipDemoCompletions: number;
  waitlistSignups: number;
  betaSignups: number;
  pilotLinkClicks: number;
  pilotClicksByChain: PilotChainCount[];
  petLinkClicks: number;
  petClicksByChain: PilotChainCount[];
  totalEvents: number;
  topZips: { zip: string; count: number }[];
};

export function getAnalyticsSummary(): AnalyticsSummary {
  const d = getDb();
  const one = (sql: string): number =>
    (d.query(sql).get() as { c: number }).c;
  return {
    uniqueVisitors: one(
      "SELECT COUNT(DISTINCT visitor_id) c FROM events WHERE visitor_id IS NOT NULL AND visitor_id != ''",
    ),
    pageviews: one("SELECT COUNT(*) c FROM events WHERE type = 'pageview'"),
    zipDemoCompletions: one(
      "SELECT COUNT(*) c FROM events WHERE type = 'zip_demo_complete'",
    ),
    waitlistSignups: one(
      "SELECT COUNT(*) c FROM events WHERE type = 'waitlist_signup'",
    ),
    betaSignups: one(
      "SELECT COUNT(*) c FROM events WHERE type = 'beta_signup'",
    ),
    pilotLinkClicks: one(
      "SELECT COUNT(*) c FROM events WHERE type = 'pilot_link_click'",
    ),
    pilotClicksByChain: d
      .query(
        "SELECT chain, zip, COUNT(*) count FROM events WHERE type = 'pilot_link_click' AND chain IS NOT NULL AND chain != '' GROUP BY chain, zip ORDER BY count DESC, chain",
      )
      .all() as PilotChainCount[],
    petLinkClicks: one(
      "SELECT COUNT(*) c FROM events WHERE type = 'pet_link_click'",
    ),
    petClicksByChain: d
      .query(
        "SELECT chain, zip, COUNT(*) count FROM events WHERE type = 'pet_link_click' AND chain IS NOT NULL AND chain != '' GROUP BY chain, zip ORDER BY count DESC, chain",
      )
      .all() as PilotChainCount[],
    totalEvents: one("SELECT COUNT(*) c FROM events"),
    topZips: d
      .query(
        "SELECT zip, COUNT(*) count FROM events WHERE zip IS NOT NULL AND zip != '' GROUP BY zip ORDER BY count DESC, zip LIMIT 10",
      )
      .all() as { zip: string; count: number }[],
  };
}
