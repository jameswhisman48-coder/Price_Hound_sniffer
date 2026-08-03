import { createFileRoute } from "@tanstack/react-router";
import { addBetaSignup } from "~/lib/waitlist-store";
import { recordEvent } from "~/lib/analytics-store";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const Route = createFileRoute("/api/beta")({
  server: { handlers: {
    POST: async ({ request }) => {
      let body: unknown;
      try { body = await request.json(); } catch { return Response.json({ ok: false, error: "Request body must be JSON." }, { status: 400 }); }
      const email = typeof body === "object" && body !== null ? (body as { email?: unknown }).email : undefined;
      if (typeof email !== "string" || email.trim().length > 254 || !EMAIL_RE.test(email.trim())) return Response.json({ ok: false, error: "Please enter a valid email address." }, { status: 400 });
      const clean = email.trim().toLowerCase();
      try { const added = addBetaSignup(clean); if (added) recordEvent("beta_signup", null, null); return Response.json({ ok: true }); }
      catch (err) { console.error("beta: failed to store signup", err); return Response.json({ ok: false, error: "Could not save your signup. Please try again." }, { status: 500 }); }
    },
    GET: async () => Response.json({ ok: false, error: "Not found." }, { status: 404 }),
  }},
});
