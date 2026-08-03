# Target API + Aldi weekly-ad live verification

**FULLY COMPLETE**  
**Run date:** 2026-08-02 (UTC)  
**Datacenter:** team verification host

## Executive verdict

Target's public website is reachable and its current browser-issued key was extracted from live browser network traffic. The legacy `redsky_aggregations` endpoints are **not usable from this datacenter in a standalone curl client**: with either community key they return HTTP 403 and a Target CAPTCHA JSON response. However, Target's current orchestration endpoint (`cdui-orchestrations.target.com`) is reachable and returned a 304,575-byte JSON response (HTTP 200) for a milk search including `zip=45202` and `store_id=2314`. That response contains product prices and fulfillment fields. Therefore Target is **technically viable but operationally fragile / not a clean public API**. Do not treat it as an official API or promise stable access.

Recommendation: **do not make Target the next unattended production crawl without an owner/legal/terms review and a CAPTCHA-aware design**. Keep Kroger as the reliable pipeline. Target can be a constrained experimental adapter only if the team accepts breakage and verifies Terms of Use. Aldi remains a link-out weekly-ad fallback, not a verified feed from this run.

## Endpoint verdict table

| Endpoint / path | Verdict | Evidence |
|---|---|---|
| `https://www.target.com/s?searchTerm=milk` | **WORKING** | Live browser navigation reached Target search page; page title was `"milk" : Target`. |
| `https://redsky.target.com/redsky_aggregations/v1/web/nearby_stores_v1` | **NOT REACHABLE (standalone)** | With live candidate key and `place=45202`: HTTP 403, `application/json`, body `{"captchaRelativeURL":"/captcha?trackingId=...","captchaAbsoluteURL":"https://redsky.target.com/captcha?..."}`. |
| `.../store_location_v1` | **NOT REACHABLE (standalone)** | With `store_id=2314`, current key: HTTP 403, same CAPTCHA JSON. |
| `.../general_recommendations_placement_v1` | **NOT REACHABLE (standalone)** | With `keyword=milk`, `pricing_store_id=2314`, current key: HTTP 403, same CAPTCHA JSON. |
| `https://cdui-orchestrations.target.com/cdui_orchestrations/v1/pages/slp` | **WORKING (current browser orchestration)** | Full curl replication returned HTTP 200, `application/json`, 304,575 bytes. Response begins `{"page_type":"slp","page_context":"...` and includes product modules, price objects and fulfillment objects. |
| Target location mapping for 45202 | **UNVERIFIED via standalone locator; store ID accepted by orchestration** | Browser network showed the locator recipe `nearby_stores_v1?limit=5&within=100&place=45202&key=...`; curl was CAPTCHA-blocked. `store_id=2314` was accepted in the working CDUI request, but this is not proof that 2314 is the nearest Cincinnati store. |
| Aldi weekly ads page | **WORKING page / UNVERIFIED feed** | `https://www.aldi.us/weekly-specials/our-weekly-ads/` redirected to `https://info.aldi.us/weekly-specials/weekly-ads` and loaded in browser. No `api.aldi.us`, `flippenterprise.net`, or `flippback.com` resource URL was observed in the quick network-resource check. |

## Current Target browser key and request recipe

The live Target page network traffic exposed the constant key:

`9f36aeafbe60771e321a7cc95a78140772ab3e96`

The older candidate `ff457966e64d5e867fde3fa82d66460883e4e7c0` was also tested; it did not bypass the 403 CAPTCHA. The key is a public client constant, not a secret. A live browser request also showed the current page's product/search orchestration request (with many context parameters):

```text
https://cdui-orchestrations.target.com/cdui_orchestrations/v1/pages/slp?
key=9f36aeafbe60771e321a7cc95a78140772ab3e96&platform=WEB&
privacy_do_not_sell=false&targeted_advertising_opt_out=false&device_type=desktop&
channel=WEB&page=%2Fs%2Fmilk&visitor_id=<visitor_id>&store_id=2314&zip=45202&
country=US&has_pending_inputs=false&count=24&default_purchasability_filter=true&
include_sponsored=true&new_search=true&offset=0&spellcheck=true&store_ids=2314&
keyword=milk&is_seo_bot=false&include_data_source_modules=true&
query_string=searchTerm%3Dmilk&timezone=UTC
```

For the live curl check, this URL was sent with:

```text
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36
Accept: application/json
Referer: https://www.target.com/s?searchTerm=milk
```

It returned HTTP 200. The response's decoded context visibly included `zip_code":"45202"` and product records. The exact required parameter set is not yet minimized: CDUI appears to tolerate/expect a large browser context, and its response used a browser-generated `visitor_id`. This is not an official documented API contract.

## Store-level price evidence

The successful CDUI response contained store-scoped product price records. Representative fragments from `/tmp/target.json`:

```json
"fulfillment":{},"promotions":[],"price":{
  "current_retail":7.19,
  "display_was_now":false,
  "formatted_current_price":"$7.19",
  "formatted_current_price_type":"reg",
  "reg_retail":7.19,
  "location_id":2314
}
```

A second product record similarly contained:

```json
"fulfillment":{"product_id":"94935835",
  "is_out_of_stock_in_all_store_locations":false,
  "sold_out":false,
  "shipping_options":{...}},
"price":{"current_retail":6.99,
  "formatted_current_price":"$6.99",
  "reg_retail":6.99,
  "location_id":2314}
```

Thus Target prices **can appear store-scoped** when the orchestration request carries a `store_id`/`store_ids` and zip context. This run did not establish a stable Cincinnati store mapping because the locator endpoint was CAPTCHA-blocked, and it did not find a sale/clearance example (`promotions` was empty in the captured examples). Target's field names are `current_retail` / `reg_retail`, not the Kroger-style `currentPrice` / `regularPrice`.

## Blocking and rate observations

- Five spaced requests to the Redsky nearby-store endpoint all returned HTTP 403 with CAPTCHA JSON; no `X-RateLimit-*` or `Retry-After` header was observed.
- Both candidate keys returned HTTP 403; changing the key did not alter the block signature.
- Responses set a large `_tgt_session` cookie (`Max-Age=86400; Path=/`) on the blocked endpoint. No `ak_bmsc` or `bm_sz` cookie was observed in the captured headers.
- The browser itself loaded the page and made the CDUI request successfully, while direct curl to Redsky was challenged. This indicates bot/session/fingerprint enforcement rather than a dead endpoint.
- `curl -sSI https://api.target.com/robots.txt`: HTTP 200, `server: Varnish`, `retry-after: 0`, `content-type: text/plain;charset=UTF-8`.
- `curl -sSI https://www.target.com/robots.txt`: HTTP 200, `content-type: text/plain`, cached response (`age` observed). Robots availability is not permission to redistribute prices; Terms still require review.

## Aldi quick check

The requested URL redirected to:

```text
https://info.aldi.us/weekly-specials/weekly-ads
```

The page loaded with title `Weekly Ads | Discover Deals on Groceries and Goods | ALDI US`. A browser performance-resource scan after load found no URL matching `api.aldi.us`, `*.flippenterprise.net`, or `flippback.com`. Consequently, this quick check did **not** identify a JSON feed URL, postal-code parameter, or an unauthenticated item/price/date response. Aldi should remain a link-out to the published weekly-ad page until a deeper embedded-widget inspection identifies and verifies a feed.

## Recommendation and next step

- **Target:** viable only as an experimental, browser-shaped orchestration client at present; not a dependable public API. The production-grade choice is **not to build Target next** until CAPTCHA behavior, Terms, request stability, and store mapping are resolved. If pursued later, mirror the Kroger shape (`target-client.ts` + SQLite cache + explicit provenance such as “Target online price; may differ in-store”), add low-volume spacing, session handling, circuit breakers, and never expose the key as a secret.
- **Aldi:** use the published weekly-ad link fallback already used by PriceHound; do not ingest/redistribute prices based on this run.
- **Kroger:** remain the primary automated price pipeline.
