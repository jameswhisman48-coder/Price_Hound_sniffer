#!/usr/bin/env bun
// View the cached Kroger price snapshot (no network). Usage: bun run prices:view
import { getKrogerPricesSummary } from "../src/lib/kroger-store";

const s = getKrogerPricesSummary();
if (s.count === 0) {
  console.log("No cached Kroger prices yet — run `bun run prices:refresh` first.");
  process.exit(0);
}
console.log(`Kroger price cache — ${s.count} item(s)`);
console.log(
  `Location: ${s.locationLabel ?? "unknown"}${s.locationId ? ` (${s.locationId})` : ""}`,
);
console.log(`Updated: ${s.fetchedAt ?? "never"}`);
console.log("");
for (const p of s.prices) {
  const price = p.pricePromo != null ? p.pricePromo : p.priceRegular;
  const was =
    p.pricePromo != null && p.priceRegular != null
      ? ` (was $${p.priceRegular.toFixed(2)})`
      : "";
  console.log(
    `${p.itemKey}\t${p.label}\t${p.description}\t$${price?.toFixed(2) ?? "n/a"}${was}`,
  );
}
