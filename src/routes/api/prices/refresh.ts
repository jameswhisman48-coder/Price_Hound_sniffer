// POST /api/prices/refresh — trigger a live Kroger price crawl (server-side only).
//
// Security notes:
//   - NEVER exposes the Kroger secret. Response contains counts/timestamps only.
//   - If PRICES_REFRESH_KEY is set in the environment, requests must carry
//     `Authorization: Bearer <key>`; otherwise it is open during the pilot.
//   - A 60 s cooldown prevents accidental double-fetches (Kroger is rate-limited).
//   - The preferred refresh path is the CLI (`bun run prices:refresh`), which
//     runs on the machine itself; this route exists for cron/scheduled calls.
import { createFileRoute } from "@tanstack/react-router";
import {
  getKrogerPricesSummary,
  refreshKrogerPrices,
} from "~/lib/kroger-store";

const COOLDOWN_MS = 60_000;

export const Route = createFileRoute("/api/prices/refresh")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const guard = process.env.PRICES_REFRESH_KEY;
        if (guard) {
          const auth = request.headers.get("authorization") ?? "";
          if (auth !== `Bearer ${guard}`) {
            return Response.json(
              { ok: false, error: "Unauthorized." },
              { status: 401 },
            );
          }
        }

        const current = getKrogerPricesSummary();
        if (
          current.fetchedAt &&
          Date.now() - new Date(current.fetchedAt).getTime() < COOLDOWN_MS
        ) {
          return Response.json({
            ok: true,
            refreshed: false,
            reason: "cooldown",
            fetchedAt: current.fetchedAt,
            prices: current.prices,
          });
        }

        try {
          const result = await refreshKrogerPrices();
          return Response.json({
            ok: true,
            refreshed: true,
            updated: result.updated,
            failed: result.failed,
            locationId: result.locationId,
            locationLabel: result.locationLabel,
            fetchedAt: result.fetchedAt,
          });
        } catch (err) {
          console.error("prices: refresh failed", err);
          return Response.json(
            { ok: false, error: "Refresh failed. See server log." },
            { status: 500 },
          );
        }
      },

      // Always 404: the refresh endpoint is POST-only.
      GET: async () =>
        Response.json({ ok: false, error: "Not found." }, { status: 404 }),
    },
  },
});
