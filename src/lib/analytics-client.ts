// Client-side analytics helper for the PriceHound landing page.
//
// PRIVACY: first-party, anonymous product counts only. We generate one random
// visitor id per browser (crypto.randomUUID), persist it in localStorage under
// "ph_vid" (no cookies, no fingerprinting, no third-party scripts), and POST
// {type, visitorId, zip?} to /api/events. The server stores only the event
// type, that anonymous id, an optional zip, and a timestamp — never an email
// or any other personal data. No tracking claims are made anywhere on the
// site, and analytics can never break the page: failures are swallowed.
//
// SERVER-ONLY STORES MUST NOT BE IMPORTED HERE: this module runs in the
// browser. It only talks to the /api/events endpoint over fetch.
const VISITOR_KEY = "ph_vid";

export type TrackableEvent =
  | "pageview"
  | "zip_demo_complete"
  | "waitlist_signup"
  | "beta_signup"
  | "pilot_link_click"
  | "pet_link_click"
  | "store_map_search";

export type TrackEventOpts = {
  zip?: string;
  /** Store chain slug — used for pilot_link_click and pet_link_click. */
  chain?: string;
};

function getVisitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    // localStorage unavailable (private mode / blocked storage): fall back to
    // a per-tab id so events still record; they just won't dedupe across tabs.
    return `tab-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

export async function trackEvent(
  type: TrackableEvent,
  opts: TrackEventOpts = {},
): Promise<void> {
  try {
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        visitorId: getVisitorId(),
        zip: opts.zip,
        chain: opts.chain,
      }),
    });
  } catch {
    // Analytics must never break the page or the waitlist form — fire and
    // forget, swallow failures silently.
  }
}
