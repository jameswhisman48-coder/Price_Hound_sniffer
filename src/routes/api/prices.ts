// GET /api/prices — read-only snapshot of the cached Kroger prices.
//
// Serves the cache only; never calls the Kroger API and never exposes
// credentials. The landing page's "Live Kroger prices" section fetches this on
// load. An empty cache returns `{ ok: true, prices: [], count: 0, ... }` so the
// UI can show its "refresh in progress" state instead of an error.
import { createFileRoute } from "@tanstack/react-router";
import { getKrogerPricesSummary } from "~/lib/kroger-store";

export const Route = createFileRoute("/api/prices")({
  server: {
    handlers: {
      GET: async () => {
        const summary = getKrogerPricesSummary();
        return Response.json({ ok: true, ...summary });
      },
    },
  },
});
