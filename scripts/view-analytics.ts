#!/usr/bin/env bun
// View first-party analytics counts. Usage: bun run analytics:view
// Prints unique visitors, total pageviews, zip-demo completions, waitlist
// signups, pilot link clicks (total + per chain), pet link clicks (total +
// per chain), and the top searched zips (counts per zip).
import { getAnalyticsSummary } from "../src/lib/analytics-store";

const s = getAnalyticsSummary();
console.log(`Unique visitors: ${s.uniqueVisitors}`);
console.log(`Pageviews: ${s.pageviews}`);
console.log(`Zip-demo completions: ${s.zipDemoCompletions}`);
console.log(`Waitlist signups: ${s.waitlistSignups}`);
console.log(`Beta signups: ${s.betaSignups}`);
console.log(`Pilot link clicks: ${s.pilotLinkClicks}`);
const clicksByChain = new Map<string, number>();
for (const c of s.pilotClicksByChain) {
  clicksByChain.set(c.chain, (clicksByChain.get(c.chain) ?? 0) + c.count);
}
if (clicksByChain.size > 0) {
  console.log("Pilot link clicks by chain:");
  for (const [chain, count] of clicksByChain) {
    console.log(`  ${chain}: ${count}`);
  }
} else {
  console.log("Pilot link clicks by chain: (none yet)");
}
console.log(`Pet link clicks: ${s.petLinkClicks}`);
const petClicksByChain = new Map<string, number>();
for (const c of s.petClicksByChain) {
  petClicksByChain.set(c.chain, (petClicksByChain.get(c.chain) ?? 0) + c.count);
}
if (petClicksByChain.size > 0) {
  console.log("Pet link clicks by chain:");
  for (const [chain, count] of petClicksByChain) {
    console.log(`  ${chain}: ${count}`);
  }
} else {
  console.log("Pet link clicks by chain: (none yet)");
}
console.log(`Total events: ${s.totalEvents}`);
console.log("Top searched zips:");
if (s.topZips.length === 0) {
  console.log("  (none yet)");
} else {
  for (const z of s.topZips) {
    console.log(`  ${z.zip}\t${z.count}`);
  }
}
