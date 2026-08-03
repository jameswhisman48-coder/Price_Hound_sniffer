// First-party analytics endpoint — POST /api/events.
// Body: { "type": "pageview" | "zip_demo_complete" | "waitlist_signup" | "beta_signup" |
//          "pilot_link_click" | "pet_link_click",
//         "visitorId"?: string, "zip"?: string, "chain"?: string }
// 200 { ok: true } | 400 { ok: false, error } | 500 { ok: false, error }
// Unknown fields are ignored (we only read type / visitorId / zip / chain).
//
// PRIVACY: this endpoint stores only the event type, an anonymous visitor id
// (random UUID generated once per browser, kept in localStorage — no cookies,
// no fingerprinting, no third parties), an optional zip, an optional chain
// slug (pilot_link_click / pet_link_click only — which store's ad page was
// opened), and a server timestamp. No IPs, no user agents, no email
// addresses. The endpoint is intentionally unauthenticated: the payload is
// anonymous, low-sensitivity aggregate counts, so there is no subscriber data
// to protect here (the waitlist route, which does hold emails, deliberately
// has no GET).
import { createFileRoute } from "@tanstack/react-router";
import { EVENT_TYPES, recordEvent } from "~/lib/analytics-store";
import type { EventType } from "~/lib/analytics-store";
import { PET_CHAIN_SLUGS, PILOT_CHAIN_SLUGS } from "~/lib/pilot-config";

const ZIP_RE = /^\d{5}$/;
const MAX_VISITOR_ID_LEN = 128;
const MAX_CHAIN_LEN = 32;

export const Route = createFileRoute("/api/events")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json(
            { ok: false, error: "Request body must be JSON." },
            { status: 400 },
          );
        }
        if (typeof body !== "object" || body === null) {
          return Response.json(
            { ok: false, error: "Request body must be a JSON object." },
            { status: 400 },
          );
        }
        const { type, visitorId, zip, chain } = body as {
          type?: unknown;
          visitorId?: unknown;
          zip?: unknown;
          chain?: unknown;
        };

        // type is the only required field and must be a known event type.
        if (
          typeof type !== "string" ||
          !(EVENT_TYPES as readonly string[]).includes(type)
        ) {
          return Response.json(
            { ok: false, error: "Invalid event type." },
            { status: 400 },
          );
        }

        // visitorId: optional, opaque, anonymous. Cap length so junk payloads
        // can't bloat the DB; anything else is ignored.
        let cleanVisitor: string | null = null;
        if (visitorId !== undefined && visitorId !== null && visitorId !== "") {
          if (
            typeof visitorId !== "string" ||
            visitorId.length > MAX_VISITOR_ID_LEN
          ) {
            return Response.json(
              { ok: false, error: "Invalid visitorId." },
              { status: 400 },
            );
          }
          cleanVisitor = visitorId;
        }

        // zip: optional; exactly 5 digits when present.
        let cleanZip: string | null = null;
        if (zip !== undefined && zip !== null && zip !== "") {
          if (typeof zip !== "string" || !ZIP_RE.test(zip)) {
            return Response.json(
              { ok: false, error: "Zip code must be 5 digits." },
              { status: 400 },
            );
          }
          cleanZip = zip;
        }

        // chain: optional, but REQUIRED for pilot_link_click / pet_link_click
        // and must be a known chain slug. Ignored for other event types.
        let cleanChain: string | null = null;
        if (chain !== undefined && chain !== null && chain !== "") {
          if (
            typeof chain !== "string" ||
            chain.length > MAX_CHAIN_LEN
          ) {
            return Response.json(
              { ok: false, error: "Invalid chain." },
              { status: 400 },
            );
          }
          cleanChain = chain;
        }
        if (type === "pilot_link_click") {
          if (!cleanChain || !PILOT_CHAIN_SLUGS.includes(cleanChain)) {
            return Response.json(
              {
                ok: false,
                error: "pilot_link_click requires a known chain slug.",
              },
              { status: 400 },
            );
          }
        }
        if (type === "pet_link_click") {
          if (!cleanChain || !PET_CHAIN_SLUGS.includes(cleanChain)) {
            return Response.json(
              {
                ok: false,
                error: "pet_link_click requires a known chain slug.",
              },
              { status: 400 },
            );
          }
        }

        try {
          recordEvent(type as EventType, cleanVisitor, cleanZip, cleanChain);
        } catch (err) {
          console.error("events: failed to store event", err);
          return Response.json(
            { ok: false, error: "Could not record event." },
            { status: 500 },
          );
        }
        return Response.json({ ok: true });
      },
    },
  },
});
