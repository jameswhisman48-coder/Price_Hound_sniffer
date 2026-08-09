# PriceHound

PriceHound is a grocery price-comparison app that helps shoppers find lower food prices and weekly deals near them by ZIP code. It is an early-stage project focused on an honest, inspectable pilot rather than broad coverage claims.

## Current status

- Cincinnati, Ohio (45202) pilot is live.
- Real Kroger online pickup prices are fetched through Kroger’s official API, cached locally in SQLite, and shown with timestamps and a note that prices may differ in-store.
- Weekly-ad sections link shoppers to each retailer's official weekly ad (hosted via Flipp) instead of redistributing ad data.
- A small pet-deals pilot provides retailer link-outs for demand testing.
- Beta testing is underway with friends and family.
- PriceHound Plus currently has a one-time $3.99 checkout for the ad-free tier as it exists today. Automatic recurring billing and roadmap features are not represented as current functionality.

## Architecture

The web app is a TanStack Start site served on port 3000. The primary data path is **Kroger official API → SQLite cache → live price section**. The site also includes ZIP-code demo results, weekly-ad link-outs, beta signup, first-party anonymous analytics, and a Stripe checkout for the current one-time Plus offer.

The `android/` directory contains the Android WebView wrapper intended for Google Play. See its `BUILD.md` for build notes.

## Local development

Requirements: [Bun](https://bun.sh/). Keep retailer credentials in a local `.env`; never commit them.

```sh
bun install
bun run dev
```

To build and publish the site using the team’s deployment process:

```sh
bun run publish
```

The app expects server-side environment variables for integrations; `.env.example` documents the names without values. Runtime SQLite databases are created under `data/` and are ignored by Git.

## Project documentation

See [`docs/`](docs/) for feasibility research, verification notes, the Google Play listing package, launch and beta materials, and the Instagram campaign draft. These documents describe current working hypotheses and pilot limitations; they are not guarantees of retailer coverage or savings.

## License

MIT. See [`LICENSE`](LICENSE).
