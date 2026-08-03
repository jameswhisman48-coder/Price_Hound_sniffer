// Waitlist API — POST /api/waitlist captures a signup.
//
// Honest-copy rule: this endpoint only persists {email, zip, timestamp} to
// local disk (data/waitlist.db). It never sends email, never calls out to any
// third-party service, and makes no tracking claims.
//
// NOTE: there is intentionally no data-exposing GET on this route. Reading
// signups is CLI-only (`bun run waitlist:view`, which reads the DB directly)
// so that subscriber emails are never exposed over the public API. The GET
// stub below exists only to return a real 404 instead of TanStack's HTML
// fall-through — it does not touch the store.
import { createFileRoute } from "@tanstack/react-router";
import { addSignup } from "~/lib/waitlist-store";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ZIP_RE = /^\d{5}$/;
const MAX_EMAIL_LEN = 254;

export const Route = createFileRoute("/api/waitlist")({
  server: {
    handlers: {
      // Body: { "email": "you@example.com", "zip": "94110" }  (zip optional)
      // 200 { ok: true } | 400 { ok: false, error } | 500 { ok: false, error }
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
        const { email, zip } = body as { email?: unknown; zip?: unknown };

        if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
          return Response.json(
            { ok: false, error: "Please enter a valid email address." },
            { status: 400 },
          );
        }
        const cleanEmail = email.trim();
        if (cleanEmail.length > MAX_EMAIL_LEN) {
          return Response.json(
            { ok: false, error: "Email address is too long." },
            { status: 400 },
          );
        }

        // Zip is optional; when present it must be exactly 5 digits.
        const cleanZip =
          typeof zip === "string" && ZIP_RE.test(zip) ? zip : null;
        if (zip !== undefined && zip !== null && zip !== "" && !cleanZip) {
          return Response.json(
            { ok: false, error: "Zip code must be 5 digits." },
            { status: 400 },
          );
        }

        try {
          addSignup(cleanEmail, cleanZip);
        } catch (err) {
          console.error("waitlist: failed to store signup", err);
          return Response.json(
            { ok: false, error: "Could not save your signup. Please try again." },
            { status: 500 },
          );
        }
        return Response.json({ ok: true });
      },

      // Always 404: signups are never readable over the API (CLI-only).
      GET: async () =>
        Response.json({ ok: false, error: "Not found." }, { status: 404 }),
    },
  },
});
