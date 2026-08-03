#!/usr/bin/env bun
// Fetch live Kroger prices for the pilot store and cache them locally.
// Usage: bun run prices:refresh
//
// Runs on the machine itself (server-side): reads credentials from .env (or the
// team credentials doc), calls the Kroger API, and upserts data/kroger.db.
import { refreshKrogerPrices } from "../src/lib/kroger-store";

console.log("Fetching live Kroger prices for the pilot store…");
const result = await refreshKrogerPrices();
console.log(`Location: ${result.locationLabel} (${result.locationId})`);
console.log(`Fetched at: ${result.fetchedAt}`);
console.log(`Updated: ${result.updated} item(s); failed: ${result.failed.length}`);
for (const f of result.failed) {
  console.log(`  - ${f.itemKey}: ${f.error}`);
}
console.log("\nCached prices:");
if (result.items.length === 0) {
  console.log("  (none)");
} else {
  for (const p of result.items) {
    const price = p.pricePromo != null ? p.pricePromo : p.priceRegular;
    const was = p.pricePromo != null && p.priceRegular != null ? ` (was $${p.priceRegular.toFixed(2)})` : "";
    console.log(
      `  ${p.itemKey.padEnd(16)} ${p.description.slice(0, 52).padEnd(52)} $${price?.toFixed(2) ?? "n/a"}${was}`,
    );
  }
}
console.log("\nDone.");
