# PriceHound live feasibility verification

**Checked:** 2026-08-02 (UTC; HTTP `Date` headers from this environment also report Sun, 02 Aug 2026). **Method:** direct `curl` plus `agent-browser` session `browser`. This is an evidence check, not legal advice; where a live page could not be reached or a key/authentication was unavailable, verdict is explicitly not a positive confirmation.

## 1. Kroger — **AMBIGUOUS (gating blocker; do not build yet)**

- **Checked / URLs:** `https://developer.kroger.com/` in agent-browser and curl; linked `https://developer.kroger.com/documentation`, `/terms-and-conditions`, and `/faq` paths.
- **Program/signup:** The live home page is up and visibly says **“APIs for Everyone”**, with **“Create an Account”**, and the 3-step flow **“1. Discover / 2. Register / 3. Integrate”**; it exposes “Register App,” Products API, and Locations API links. This is strong evidence that new developer registration remains presented/open, but I did not submit an account or verify approval timing.
- **Rate limits:** Not verified. The live documentation route returned a blank/no-interactive-elements page in browser and the guessed terms/FAQ paths did not expose usable text. No reliable current Products/Locations free-tier limit was found, so the prior “free tier” claim must not be treated as confirmed.
- **Commercial redistribution / aggregation:** Not verified. The developer home page links “Terms and Conditions,” but the fetched/guessed page did not yield the terms body or a quotable redistribution clause. Therefore I cannot honestly quote a current clause or answer yes/no. The research report’s assertion that terms restrict commercial redistribution/resale remains unverified.
- **Verdict evidence:** Registration is visibly offered, but the decisive terms and limits were not retrievable in this run. **Do not use Kroger data in a consumer comparison product until Kroger confirms redistribution/display rights in writing or the actual current agreement is reviewed.**

## 2. Target — **RISKY / NOT VERIFIED**

- **Checked / URL:** `https://api.target.com/redsky_aggregations/v1/web/plp_search_v2` with a typical browser User-Agent and PLP search parameters (milk), via curl; also attempted browser navigation to the endpoint.
- **Evidence:** The endpoint responded HTTP **404** with XML `The requested resource was not found` (not a successful unauthenticated product payload). The first attempted request was malformed due to an invalid key/query; the corrected request still returned 404. No price or storeId availability fields were observed.
- **Verdict:** **RISKY** for planning purposes: endpoint is not confirmed viable from this datacenter request, and no store-level price evidence was obtained. This is not proof of a universal shutdown—the request may require the current site-issued key, exact path/headers, cookies, or a different endpoint—but it is not sufficient evidence to build against.

## 3. Walmart Affiliate API — **AMBIGUOUS / NOT VERIFIED**

- **Checked / URLs:** `https://affiliate-program.walmart.com` (curl DNS lookup failed: could not resolve host); `https://developer.walmart.com/` (curl).
- **Evidence:** The current developer site responded HTTP 200 but delivered only 1 byte with redirect/render behavior and Cloudflare/Bot-management cookies; response headers showed `X-RateLimit-Limit: 100` and remaining 94 for the developer site, not an Item Search entitlement. The affiliate-program hostname could not be resolved from this environment. No application acceptance, Item Search category list, grocery coverage, or retention terms were verified.
- **Verdict:** **AMBIGUOUS**. Keep Walmart out of the initial pipeline; do not infer grocery coverage or retention rights from the developer landing response. The research recommendation to avoid Walmart scraping remains prudent.

## 4. ALDI US — **RISKY (structured backing services visible; extraction/permission not established)**

- **Checked / URL:** `https://www.aldi.us/weekly-specials/our-weekly-ads/` via curl (canonical redirects/references `https://info.aldi.us/weekly-specials/weekly-ads`).
- **Evidence:** Live HTML is a Nuxt application, not a PDF-only page. It contains a preconnect to `https://api.aldi.us` and references Flipp infrastructure (`aq.flippenterprise.net`, `cdn.flippenterprise.net`, `dam.flippenterprise.net`, `cdn-gateflipp.flippback.com`). This indicates structured/API-backed weekly-ad delivery, but I did not call a documented public API or establish that its data may be redistributed. No store-locator JSON endpoint was confirmed.
- **Verdict:** **RISKY** rather than “good”: likely technically discoverable, but endpoint/schema and ToS/permission remain unverified. Treat weekly-ad extraction as an experiment only, with robots/ToS review and no promise of a stable API.

## 5. Meijer — **NOT VIABLE FROM THIS DATACENTER REQUEST / RISKY**

- **Checked / URL:** `https://www.meijer.com/shopping/search.html?query=milk` via curl.
- **Evidence:** Immediate Akamai response was HTTP access-denied HTML: **“Access Denied … You don't have permission to access …”**, with an `errors.edgesuite.net` reference. No product JSON, price, store, or zip fields were returned.
- **Verdict:** **RISKY** (operationally not viable from this environment). This does not prove every client/network is blocked or that an internal JSON endpoint is gone, but the prior “known open JSON pattern” was not live-confirmed. Do not build a scraper until endpoint and permission are separately confirmed.

## Overall recommendation

No live check in this run establishes a permitted, production-ready chain for a commercial comparison pipeline. Kroger registration appears open, but the make-or-break commercial-use terms and current free-tier limits were not retrievable; Target did not return a usable payload; Walmart affiliate access/terms were unavailable; ALDI is API-backed but undocumented/unpermissioned; Meijer blocked the request. The immediate next step is a human/legal review of the actual Kroger developer agreement plus a support/application confirmation specifically asking whether PriceHound may cache, display, aggregate, and compare Kroger prices.

**Kroger API: AMBIGUOUS — recommendation: rework plan / pause crawler build pending written permission and current limits.**
