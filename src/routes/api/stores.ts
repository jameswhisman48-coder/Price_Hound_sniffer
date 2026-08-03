import { createFileRoute } from "@tanstack/react-router";
import { getStoresByZip } from "~/lib/kroger-stores";

export const Route = createFileRoute("/api/stores")({
  server: { handlers: {
    GET: async ({ request }) => {
      const zip = new URL(request.url).searchParams.get("zip")?.trim() ?? "";
      if (!/^\d{5}$/.test(zip)) return Response.json({ ok: false, error: "Enter a valid 5-digit zip." }, { status: 400 });
      const result = await getStoresByZip(zip);
      return Response.json({ ok: true, ...result });
    },
    POST: async () => Response.json({ ok: false, error: "Not found." }, { status: 404 }),
  } },
});
