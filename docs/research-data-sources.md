# PriceHound — Real Price Data Sources: Research Report

**Researcher:** agent-researcher | **Date:** 2026-08-02 | **Status:** Research complete
**Reading caveat:** This session had no live web access — facts are from prior knowledge of the retail-data ecosystem, flagged VERIFIED-LIKELY vs UNVERIFIED. A live verification checklist is at the end; do not build on unverified endpoints/terms.

## TL;DR

- **No single licensing path exists for a bootstrapped startup.** Enterprise syndicated providers (NielsenIQ, Circana/IRi, Numerator, SPINS) cost six figures and sell aggregate panels, not per-store shelf prices. Instacart/Flipp licensing is enterprise-only. The realistic path is **DIY: official APIs where they exist + targeted scraping where they don't, starting with 3–5 chains in one metro.**
- **Best official API:** Kroger (products + price + store locator). **Best unofficial-but-practical endpoints:** Target (store-level price + availability via its own web JSON API) and the Albertsons-family sites. **Best scrape candidates:** Aldi (weekly ad, no login, low enforcement risk) and Meijer/Publix/H-E-B/Food Lion (light bot protection).
- **Avoid scraping:** Walmart, Amazon/Whole Foods, Instacart (aggressive bot defense, litigious).
- **Clearance is the hardest data.** True in-store markdowns are almost never online. The obtainable proxy is **weekly-ad/sale data (Flipp + retailer ads) and online clearance collections (Target, Walmart)** — plus crowdsourcing later. Recommend pitch = "lowest prices + weekly-ad deals," with in-store clearance as a crowdsourced feature, not a crawled one.
- **Pilot recommendation:** one metro — **Cincinnati, OH** (Kroger HQ coverage + Walmart + Target + Aldi + Meijer). Effort: ~2 weeks for a 3-chain MVP, 4–6 weeks for the full 5-chain pilot.
- **Biggest kill risks:** (1) only ~4 major chains expose usable store-level price data, (2) online price ≠ shelf price, (3) scraping ToS/CFAA exposure, (4) price staleness destroying trust.

## Q1. Store APIs vs. scraping — per-chain inventory

| Chain | Official API? | What exists | Store-level prices? | Scrape viability | Notes |
|---|---|---|---|---|---|
| **Kroger** | ✅ developer.kroger.com (OAuth2) | Products API (search, price, availability), Stores API (locator by zip/lat-lng), Nutrition, Pharmacy | ✅ price tied to fulfillment store (`locationId`) | n/a (use API) | Free tier, registration + approval, rate limits. **Terms restrict commercial redistribution/resale — MUST verify before building.** |
| **Walmart** | ⚠️ Affiliate API | Item search/lookup + price for walmart.com SKUs (mostly marketplace) | ❌ national online price only | 🚫 Very hard (PerimeterX/HUMAN, CAPTCHA; litigates) | Affiliate approval can be denied; terms limit retention. No in-store grocery coverage. |
| **Target** | ⚠️ Unofficial-but-stable api.target.com ("redsky") | Product + price + store-level availability via `storeId`; store locator; clearance collections | ✅ per-store via storeId | ⚠️ Medium (no official program; datacenter IPs sometimes blocked) | Widely used by open-source price trackers. |
| **Aldi (US)** | ❌ None | Weekly ad ("ALDI Finds") with item+price; store locator | ⚠️ uniform prices nationally/regionally | ✅ Good (server-rendered/JSON, no login) | Enforcement risk low; ToS prohibit scraping. |
| **Safeway/Albertsons family** | ❌ None public | Internal JSON product/price endpoints per brand site; store-specific price once fulfillment store selected | ✅ per fulfillment store | ⚠️ Medium (Akamai) | Regional banners — pick banner matching pilot city. |
| **Publix** | ❌ None public | JSON product/price endpoints + store locator | ⚠️ Partial (many items online-priced) | ✅ Good (light protection) | FL/GA/SE region. |
| **Meijer** | ❌ None public | meijer.com JSON product API with store-level price | ✅ | ✅ Good (known open JSON pattern) | Midwest (MI/OH/IL/IN/WI). Strong pilot candidate. |
| **H-E-B** | ❌ None public | heb.com curbside-platform JSON endpoints | ✅ (curbside fulfillment store) | ✅ Good | Texas only. |
| **Ahold Delhaize USA** (Stop & Shop, Giant, Food Lion, Hannaford) | ❌ None public | Brand-site JSON endpoints (Food Lion known pattern) | ✅ | ✅ Good | Northeast/Mid-Atlantic/Southeast. |
| **Whole Foods** | ❌ None | Prices via Amazon only | ⚠️ via Amazon only | 🚫 Skip | — |
| **Costco** | ❌ None | Many SKUs warehouse-only, member-gated | ❌ | ⚠️ Medium, low value | Skip for pilot. |
| **Trader Joe's** | ❌ None | **No online prices at all** | ❌ | n/a | Skip (crowdsource later). |
| **Sprouts / Natural Grocers / others** | ❌ None | JSON on sites | ⚠️ Partial | ✅ Good | Minor additions later. |

### Scraping legal landscape
- **CFAA:** *Van Buren* (2021) narrowed "exceeds authorized access"; 9th Cir. *hiQ v. LinkedIn* (2022, later settled) held scraping public data isn't CFAA "without authorization" — persuasive only in 9th Cir., no binding final precedent. Risk spikes if you bypass auth, defeat CAPTCHAs, or continue after a C&D (*Facebook v. Power Ventures*).
- **ToS/contract:** retailer ToS ban automated access; breach-of-contract claims possible (*Craigslist v. 3Taps*); C&D + continued scraping is the classic CFAA trigger.
- **robots.txt:** not legally binding in the US but evidence of authorization/intent — respect it.
- **DMCA §1201:** only if you circumvent technical protection measures — avoid.
- **Practice:** retailers mostly respond with blocking (IP bans, fingerprinting), not lawsuits — except **Walmart and Amazon**, who litigate. Strategy: **API first, scrape low-protection chains, never scrape Walmart/Amazon/Instacart.**
- **Operational:** scrapers rot; maintenance is the real tax. Prefer JSON endpoints over HTML parsing.

## Q2. Third-party data aggregators

| Provider | What | Access for bootstrapper? |
|---|---|---|
| **Instacart** | Store-level catalog + prices for partner chains | ❌ No public API; enterprise licensing only; scraping Akamai-protected. |
| **Shipt** | Delivery catalog | ❌ No public API. |
| **Flipp** | Weekly-ad aggregation (Kroger, Aldi, Publix, Safeway, Target, Walmart ads) with item-level prices | ⚠️ Enterprise licensing; web JSON endpoints scraped by deal sites for years. Best ads/deals source. |
| **NielsenIQ / Circana / Numerator / SPINS** | Syndicated retail measurement | ❌ Enterprise ($100K+/yr), aggregate panels, not per-store shelf prices. |
| **Price-monitoring SaaS** (Prisync, Price2Spy, Competera) | Scrape-as-a-service | ⚠️ ~$100–$1,000s/mo; e-commerce SKUs, wrong shape for grocery. |
| **OpenFoodFacts** | Product data + some prices | ⚠️ Free; sparse/stale US prices; good for barcode normalization. |
| **BrickSeek** | Crowdsourced in-store clearance (Target/Walmart/Best Buy) | ⚠️ Proves crowdsourcing model; not licensable. |
| **USDA / BLS / Census** | Price indices, ZCTA geography | ✅ Free, macro-level; useful for zip→geo mapping. |

**Verdict:** No viable licensed data path for a bootstrapped team. Assume DIY collection.

## Q3. Zip → stores → prices

- ZIP codes are mail routes. Standard approach: zip → centroid (Census ZCTAs free, or SimpleMaps ~$99) → radius 5–10 mi → store set per chain via chain store locators (Kroger Stores API ✅, Target ✅, Walmart ⚠️, Aldi ✅, Publix ✅, Albertsons ⚠️; fallback Google Places or OSM Overpass).
- Persist a `stores` table (chain, store_id, lat, lng, zip), re-sync weekly.
- **Store-level prices online exist for:** Kroger (per locationId), Target (per storeId), Albertsons/Safeway family, Meijer, H-E-B, Food Lion/Ahold. **National/catalog only:** Walmart affiliate API, Amazon. **No online prices:** Trader Joe's (zero), Aldi (uniform), Costco (mostly gated).
- **Critical caveat:** online/fulfillment price ≠ in-store shelf price. Label provenance honestly ("online pickup price") or users catch errors and lose trust.

## Q4. Clearance / markdown data

1. **Weekly-ad / circular data (best obtainable proxy):** Flipp + chain ad pages (Kroger weekly ad JSON, Aldi Finds, Publix, Safeway, Meijer ads).
2. **Online clearance collections:** Target clearance category (price + `was`), Walmart clearance (scrape-resistant; affiliate API can surface markdowns for covered SKUs), Meijer clearance.
3. **In-store markdowns: not obtainable by crawling.** Only crowdsourcing (BrickSeek model) or store relationships. **Recommendation: don't promise crawled in-store clearance; make it a crowdsourced community feature; position "clearance" as "sale/weekly-ad deals + online clearance" for the pilot.**

## Q5. Pilot recommendation

**City: Cincinnati, OH** (dense coverage of Kroger HQ + Walmart + Target + Aldi + Meijer; also Costco/Sam's). Alternative: Tampa/Orlando, FL (swap Meijer for Publix).

| # | Chain | Data path | Store-level? | Effort | Primary risk |
|---|---|---|---|---|---|
| 1 | Kroger | **Official API** (OAuth2, Products + Stores) | ✅ | Low | API approval & terms (redistribution clause — verify) |
| 2 | Target | api.target.com products + storeId | ✅ | Low–Med | ToS; endpoint/access changes; IP blocks |
| 3 | Aldi | Scrape aldi.us weekly ad + store locator | ⚠️ uniform | Medium | Ad-format changes; ToS (low enforcement) |
| 4 | Walmart | Affiliate API (national online only — be transparent) | ❌ | Low | Approval denial; poor grocery coverage; **do NOT scrape** |
| 5 | Meijer (Cincy) / Publix (FL) | Scrape site JSON endpoints | ✅ | Medium | ToS; breakage |

**Out of scope:** Amazon/Whole Foods, Costco, Trader Joe's, Instacart/Shipt, syndicated providers.

**Effort:** Wk 1–2 Kroger + Target + Aldi → real deals for one Cincy zip (~2 wks, 3-chain MVP). Wk 3–4 Walmart + Meijer, zip→store mapping, price normalization (unit prices!). Wk 5–6 weekly-ad ingestion + engagement measurement. Total 4–6 weeks to credible single-city pilot.

### Risks
1. **Kroger API terms may prohibit the exact use case (commercial redistribution/aggregation) — verify first; if so the flagship chain is off the table.**
2. Legal exposure on scraping — mitigate via API-first, avoid Walmart/Amazon/Instacart, respect robots.txt, stop on C&D.
3. Unit/quantity normalization (gal vs oz vs count) is a genuine engineering problem.
4. Online price ≠ shelf price — mislabeling destroys trust.
5. Price staleness — stale data worse than no data.
6. Clearance largely unobtainable by crawling — reposition pitch if needed.
7. Only ~4 major chains expose usable store-level data — national scale-up is a maintenance treadmill, not licensing.

## Verification checklist (must do LIVE before building)
1. **Kroger developer portal** — signup flow, free-tier rate limits, and the **redistribution/aggregation clause** in their terms. (Most important.)
2. **Target** — current product-endpoint path/headers; datacenter-IP blocks.
3. **Walmart Affiliate API** — approval process, grocery SKU coverage, retention limits.
4. **Flipp** — partner API obtainable for a startup? State of web JSON endpoints.
5. **Aldi US** — weekly-ad data format (JSON vs PDF).
6. **Meijer/Publix** — current product-endpoint JSON shape.
7. Store geocoding approach (chain locators vs Google Places pricing).
8. Retailer ToS text on automated access for each scrape target.
