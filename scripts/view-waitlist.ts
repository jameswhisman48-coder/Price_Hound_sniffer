#!/usr/bin/env bun
// View captured waitlist signups. Usage: bun run waitlist:view
// Prints a count and one line per signup: <timestamp> <email> <zip|->
import { listSignups } from "../src/lib/waitlist-store";

const signups = listSignups();
console.log(`Waitlist signups: ${signups.length}`);
for (const s of signups) {
  console.log(`${s.created_at}\t${s.email}\t${s.zip ?? "-"}`);
}
