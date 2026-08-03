// Pilot configuration — the ONE place to change the pilot metro.
//
// The permission-free fallback pilot links to each chain's OWN published
// weekly-ad/deals page. We point, we don't republish: no scraping, no price
// data is fetched, cached, or stored. Each link opens the store's page; the
// store handles zip/store selection on arrival.
//
// URL verification (2026-08-02):
//   - Aldi / Target: verified live (HTTP 200) from this environment.
//   - Walmart: verified via read-through (HTTP 200 with real content); direct
//     requests from datacenter IPs are bot-blocked (redirects to /blocked),
//     which does not affect real users.
//   - Kroger / Meijer: canonical weekly-ad URLs; this datacenter is
//     network-blocked (Kroger: connection reset; Meijer: Akamai 403) so they
//     could not be fetched live here. Both are store-based — the store's own
//     page prompts for zip/store on arrival. Re-verify from a consumer
//     network before launch if a chain looks stale.
export const PILOT_ZIP = "45202";
export const PILOT_CITY = "Cincinnati";
export const PILOT_STATE = "OH";
export const PILOT_LABEL = `${PILOT_CITY}, ${PILOT_STATE}`;

export const PILOT_CHAINS = [
  {
    slug: "kroger",
    name: "Kroger",
    url: "https://www.kroger.com/weeklyad",
    note: "Official weekly ad · prices this week",
    detail: "Store-based — Kroger asks for your zip/store on arrival.",
  },
  {
    slug: "aldi",
    name: "ALDI",
    url: "https://www.aldi.us/weekly-specials/our-weekly-ads/",
    note: "Official ALDI Finds weekly ad",
    detail: "National weekly ad — the same ALDI Finds items each week.",
  },
  {
    slug: "target",
    name: "Target",
    url: "https://www.target.com/c/weekly-ad/-/N-5xt1a",
    note: "Official weekly ad",
    detail: "National weekly ad plus the weekly deals hub.",
  },
  {
    slug: "walmart",
    name: "Walmart",
    url: "https://www.walmart.com/weekly-ad",
    note: "Official weekly ad",
    detail: "Zip-based — enter 45202 to see your local ad.",
  },
  {
    slug: "meijer",
    name: "Meijer",
    url: "https://www.meijer.com/shopping/weekly-ad.html",
    note: "Official weekly ad",
    detail: "Store-based — Meijer asks for your zip/store on arrival.",
  },
] as const;

export type PilotChainSlug = (typeof PILOT_CHAINS)[number]["slug"];

/** Server-side validation whitelist for the analytics `chain` field. */
export const PILOT_CHAIN_SLUGS: readonly string[] = PILOT_CHAINS.map(
  (c) => c.slug,
);

/* ------------------------------------------------------------------ */
/* Pet deals — pilot (link-out demand test)                            */
/* ------------------------------------------------------------------ */
//
// Same pattern as PILOT_CHAINS: we link to each pet retailer's OWN official
// deals/sale page. We point, we don't republish — no price data is fetched,
// cached, or stored.
//
// Why only PetSmart is listed (research verdict, 2026-08-02):
//   - No pet retailer has a viable automated price-data path (no public API;
//     affiliate feeds carry comparison-use term risk and national-only
//     prices; all are bot-protected against scraping), so this section is a
//     link-out demand test only.
//   - PetSmart: deals page https://www.petsmart.com/sale/ verified live
//     (HTTP 200, page title "Sale | PetSmart") from this datacenter's
//     browser. LINKED.
//   - Petco: serves blank "Page Not Found"/"Whoops" pages to this
//     datacenter's IP even on its homepage, and the guessed weekly-ad URL
//     https://www.petco.com/shop/en/petcostore/s/weekly-ad redirects to a
//     404. DO NOT LINK until re-verified from a consumer network.
//   - Chewy: returns an explicit 403 ("No treats beyond this point") from
//     this datacenter. DO NOT LINK until re-verified from a consumer
//     network.
//   - Flipp's PetSmart circular URL 404'd — not used.
// PENDING: Petco/Chewy URLs must pass a consumer-network click-test before
// they can be added here. Until then, PetSmart is the only entry.
export const PET_CHAINS = [
  {
    slug: "pet-smart",
    name: "PetSmart",
    url: "https://www.petsmart.com/sale/",
    note: "Official PetSmart deals page",
    detail:
      "Online deals & weekly promotions — more pet retailers coming as we verify them.",
  },
] as const;

export type PetChainSlug = (typeof PET_CHAINS)[number]["slug"];

/** Server-side validation whitelist for the analytics `chain` field. */
export const PET_CHAIN_SLUGS: readonly string[] = PET_CHAINS.map(
  (c) => c.slug,
);
