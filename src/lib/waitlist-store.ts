// Server-only waitlist storage. Uses bun:sqlite (Bun's built-in SQLite — zero
// extra dependencies) with a local DB file at <site>/data/waitlist.db.
//
// WARNING:
// - SERVER-ONLY. bun:sqlite does not exist in the browser — never import this
//   module from client code.
// - LOCAL DISK storage for the pre-launch demand-validation phase only. Swap it
//   for a real database (the team's Neon DATABASE_URL via ~/db) before any
//   production go-live — serverless hosts (Vercel) do not persist file writes.
// - Honest-copy rule: we only STORE email + zip + timestamp. Nothing is sent
//   anywhere, no tracking, no third parties.
import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";

// Anchor the data dir to the SITE ROOT, not this module's location: the
// bundler moves this module into dist/server/assets/, so import.meta.dir
// differs between source (src/lib) and the built server (dist/server/assets)
// and between server and CLI runs. process.cwd() is the site root in every
// supported path:
//   - publish.sh does `cd "$(dirname "$0")"` before launching the server
//   - `bun run` scripts (waitlist:view, start) execute with cwd = package root
// An override via WAITLIST_DATA_DIR is available for odd setups.
const DATA_DIR = process.env.WAITLIST_DATA_DIR
  ? path.resolve(process.env.WAITLIST_DATA_DIR)
  : path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "waitlist.db");

export type WaitlistEntry = {
  email: string;
  zip: string | null;
  created_at: string;
};

let db: Database | null = null;

function getDb(): Database {
  if (!db) {
    mkdirSync(DATA_DIR, { recursive: true });
    db = new Database(DB_FILE);
    db.run(`
      CREATE TABLE IF NOT EXISTS waitlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        zip TEXT,
        created_at TEXT NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS waitlist_email_unique ON waitlist(email);
      CREATE TABLE IF NOT EXISTS beta_signups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL
      );
    `);
  }
  return db;
}

export function addSignup(email: string, zip: string | null): void {
  const d = getDb();
  d.run(
    "INSERT INTO waitlist (email, zip, created_at) VALUES (?, ?, ?)",
    email,
    zip,
    new Date().toISOString(),
  );
}

export function listSignups(): WaitlistEntry[] {
  const d = getDb();
  return d
    .query("SELECT email, zip, created_at FROM waitlist ORDER BY id")
    .all() as WaitlistEntry[];
}

export function addBetaSignup(email: string): boolean {
  const d = getDb();
  const result = d.run("INSERT OR IGNORE INTO beta_signups (email, created_at) VALUES (?, ?)", email, new Date().toISOString());
  return result.changes > 0;
}
export function listBetaSignups() {
  return getDb().query("SELECT email, created_at FROM beta_signups ORDER BY id").all() as { email: string; created_at: string }[];
}
