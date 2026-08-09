// Pilot configuration — the ONE place to change the pilot metro.
//
// The permission-free fallback pilot links to each retailer's official weekly
// ad hosted by Flipp. We point, we don't republish: no scraping, no price data
// is fetched, cached, or stored. Flipp asks for a zip/region on first visit so
// shoppers can select the local circular.
//
// Link decision (2026-08-03): direct chain URLs broke for real users — Target
// returned 404s via stale page IDs, Walmart robot-blocked, and Meijer returned
// Access-Denied. Flipp is a licensed ad platform with stable national URLs;
// all five URLs below were verified HTTP 200 from this environment. Old URLs
// retained for the record:
//   Kroger: https://www.kroger.com/weeklyad
//   Aldi: https://www.aldi.us/weekly-specials/our-weekly-ads/
//   Target: https://www.target.com/c/weekly-ad/-/N-5xt1a
//   Walmart: https://www.walmart.com/weekly-ad
//   Meijer: https://www.meijer.com/shopping/weekly-ad.html
export const PILOT_ZIP = "45202";
export const PILOT_CITY = "Cincinnati";
export const PILOT_STATE = "OH";
export const PILOT_LABEL = `${PILOT_CITY}, ${PILOT_STATE}`;

export const PILOT_CHAINS = [
  {
    slug: "kroger",
    name: "Kroger",
    url: "https://flipp.com/weekly-circular/kroger",
    note: "Weekly ad via Flipp",
    detail: "Flipp shows Kroger's local weekly ad — pick your store/zip on arrival.",
  },
  {
    slug: "aldi",
    name: "ALDI",
    url: "https://flipp.com/weekly-circular/aldi",
    note: "Weekly ad via Flipp",
    detail: "Flipp shows ALDI's local weekly ad — pick your region/zip on arrival.",
  },
  {
    slug: "target",
    name: "Target",
    url: "https://flipp.com/weekly-circular/target",
    note: "Weekly ad via Flipp",
    detail: "Flipp shows Target's local weekly ad — pick your store/zip on arrival.",
  },
  {
    slug: "walmart",
    name: "Walmart",
    url: "https://flipp.com/weekly-circular/walmart",
    note: "Weekly ad via Flipp",
    detail: "Flipp shows Walmart's local weekly ad — pick your store/zip on arrival.",
  },
  {
    slug: "meijer",
    name: "Meijer",
    url: "https://flipp.com/weekly-circular/meijer",
    note: "Weekly ad via Flipp",
    detail: "Flipp shows Meijer's local weekly ad — pick your store/zip on arrival.",
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
