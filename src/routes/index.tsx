import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import type { FormEvent, RefObject } from "react";
import { trackEvent } from "~/lib/analytics-client";
import { PILOT_CHAINS, PILOT_LABEL, PILOT_ZIP, PET_CHAINS } from "~/lib/pilot-config";
import { PLUS_PAYMENT_LINK } from "~/lib/config";

export const Route = createFileRoute("/")({ component: Home });

/* ------------------------------------------------------------------ */
/* Types & demo data (all fictional — clearly labeled in the UI)       */
/* ------------------------------------------------------------------ */

type GroceryDeal = {
  item: string;
  qty: string;
  store: string;
  price: number;
  avg: number;
};

type ClearanceDeal = {
  item: string;
  store: string;
  price: number;
  was: number;
};

type DemoSet = {
  city?: string;
  groceries: GroceryDeal[];
  clearance: ClearanceDeal[];
};

const BASE_SET: DemoSet = {
  groceries: [
    { item: "Whole milk", qty: "1 gal", store: "FreshMart", price: 2.49, avg: 2.89 },
    { item: "Large eggs", qty: "dozen", store: "GreenGrocer", price: 3.19, avg: 3.79 },
    { item: "Bananas", qty: "per lb", store: "Market Basket", price: 0.49, avg: 0.61 },
    { item: "Chicken breast", qty: "per lb", store: "SaveMore", price: 2.99, avg: 3.49 },
    { item: "Extra-virgin olive oil", qty: "750 ml", store: "FreshMart", price: 6.99, avg: 8.49 },
    { item: "Greek yogurt", qty: "32 oz", store: "Daily Deals", price: 3.99, avg: 4.79 },
    { item: "Ground beef 80/20", qty: "per lb", store: "SaveMore", price: 4.29, avg: 4.99 },
  ],
  clearance: [
    { item: "55″ 4K Smart TV", store: "BigBox Outlet", price: 329, was: 499 },
    { item: "Wireless noise-cancelling headphones", store: "TechLane", price: 89, was: 149 },
    { item: "Robot vacuum", store: "HomeGoodsPlus", price: 159, was: 249 },
    { item: "6-qt air fryer", store: "BigBox Outlet", price: 39, was: 69 },
  ],
};

// A few real-feeling zip variants so the demo doesn't look static. Each is
// still 100% fictional sample data.
const ZIP_SETS: Record<string, DemoSet> = {
  "94110": {
    city: "San Francisco",
    groceries: [
      { item: "Whole milk", qty: "1 gal", store: "Pacific Pantry", price: 2.59, avg: 3.05 },
      { item: "Large eggs", qty: "dozen", store: "Golden Gate Grocery", price: 3.49, avg: 3.99 },
      { item: "Bananas", qty: "per lb", store: "Bayview Market", price: 0.55, avg: 0.69 },
      { item: "Chicken breast", qty: "per lb", store: "Mission Foods", price: 3.29, avg: 3.79 },
      { item: "Extra-virgin olive oil", qty: "750 ml", store: "Pacific Pantry", price: 7.49, avg: 8.99 },
      { item: "Greek yogurt", qty: "32 oz", store: "Bay Fresh", price: 4.19, avg: 4.99 },
      { item: "Sourdough loaf", qty: "each", store: "Bayview Market", price: 3.99, avg: 4.99 },
    ],
    clearance: [
      { item: "55″ 4K Smart TV", store: "Harbor Outlet", price: 349, was: 499 },
      { item: "Wireless noise-cancelling headphones", store: "Cable & Co.", price: 99, was: 159 },
      { item: "Espresso machine", store: "Bay City Home", price: 199, was: 299 },
      { item: "6-qt air fryer", store: "Harbor Outlet", price: 45, was: 75 },
    ],
  },
  "10001": {
    city: "New York",
    groceries: [
      { item: "Whole milk", qty: "1 gal", store: "Metro Mart", price: 2.39, avg: 2.79 },
      { item: "Large eggs", qty: "dozen", store: "FreshChoice", price: 2.99, avg: 3.59 },
      { item: "Bananas", qty: "per lb", store: "Corner Grocer", price: 0.49, avg: 0.59 },
      { item: "Chicken breast", qty: "per lb", store: "Union Square Foods", price: 2.89, avg: 3.39 },
      { item: "Extra-virgin olive oil", qty: "750 ml", store: "Metro Mart", price: 6.79, avg: 8.29 },
      { item: "Greek yogurt", qty: "32 oz", store: "FreshChoice", price: 3.79, avg: 4.59 },
      { item: "Cream cheese", qty: "8 oz ×4", store: "Corner Grocer", price: 4.49, avg: 5.49 },
    ],
    clearance: [
      { item: "55″ 4K Smart TV", store: "Empire Electronics", price: 319, was: 499 },
      { item: "Wireless noise-cancelling headphones", store: "Circuit Lane", price: 79, was: 129 },
      { item: "Robot vacuum", store: "Gotham Home Goods", price: 149, was: 229 },
      { item: "4K streaming stick", store: "Empire Electronics", price: 25, was: 49 },
    ],
  },
  "60614": {
    city: "Chicago",
    groceries: [
      { item: "Whole milk", qty: "1 gal", store: "Lakeshore Market", price: 2.29, avg: 2.69 },
      { item: "Large eggs", qty: "dozen", store: "Windy City Grocer", price: 2.89, avg: 3.49 },
      { item: "Bananas", qty: "per lb", store: "Dearborn Foods", price: 0.49, avg: 0.59 },
      { item: "Chicken breast", qty: "per lb", store: "Second City Market", price: 2.79, avg: 3.29 },
      { item: "Extra-virgin olive oil", qty: "750 ml", store: "Lakeshore Market", price: 6.59, avg: 7.99 },
      { item: "Greek yogurt", qty: "32 oz", store: "Windy City Grocer", price: 3.69, avg: 4.49 },
      { item: "Sourdough loaf", qty: "each", store: "Dearborn Foods", price: 3.49, avg: 4.29 },
    ],
    clearance: [
      { item: "55″ 4K Smart TV", store: "Loop Electronics", price: 309, was: 479 },
      { item: "Wireless noise-cancelling headphones", store: "North Ave Gadgets", price: 79, was: 129 },
      { item: "Robot vacuum", store: "Prairie Home Outlet", price: 139, was: 219 },
      { item: "Espresso machine", store: "Loop Electronics", price: 189, was: 279 },
    ],
  },
  "78704": {
    city: "Austin",
    groceries: [
      { item: "Whole milk", qty: "1 gal", store: "Lone Star Grocery", price: 2.45, avg: 2.85 },
      { item: "Large eggs", qty: "dozen", store: "Bluebonnet Market", price: 3.09, avg: 3.69 },
      { item: "Bananas", qty: "per lb", store: "Hill Country Foods", price: 0.47, avg: 0.59 },
      { item: "Chicken breast", qty: "per lb", store: "TexaSave", price: 2.79, avg: 3.29 },
      { item: "Extra-virgin olive oil", qty: "750 ml", store: "Lone Star Grocery", price: 6.89, avg: 8.39 },
      { item: "Greek yogurt", qty: "32 oz", store: "Bluebonnet Market", price: 3.89, avg: 4.69 },
      { item: "Flour tortillas", qty: "12 ct", store: "Hill Country Foods", price: 2.29, avg: 2.99 },
    ],
    clearance: [
      { item: "55″ 4K Smart TV", store: "Frontier Electronics", price: 339, was: 499 },
      { item: "Wireless noise-cancelling headphones", store: "Signal Lane", price: 85, was: 149 },
      { item: "Robot vacuum", store: "Cedar Park Home", price: 159, was: 249 },
      { item: "6-qt air fryer", store: "Frontier Electronics", price: 39, was: 69 },
    ],
  },
};

function dealsForZip(zip: string): DemoSet {
  return ZIP_SETS[zip] ?? BASE_SET;
}

/* ------------------------------------------------------------------ */
/* Icons & small bits                                                  */
/* ------------------------------------------------------------------ */

function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect x="4" y="4" width="56" height="56" rx="16" fill="#059669" />
      <circle cx="46" cy="17" r="5.5" fill="#fff" />
      <ellipse cx="29" cy="40" rx="10" ry="8.5" fill="#fff" />
      <ellipse
        cx="18"
        cy="30.5"
        rx="3.6"
        ry="4.9"
        fill="#fff"
        transform="rotate(-24 18 30.5)"
      />
      <ellipse cx="25.5" cy="26" rx="3.5" ry="4.9" fill="#fff" />
      <ellipse cx="33" cy="26" rx="3.5" ry="4.9" fill="#fff" />
      <ellipse
        cx="40"
        cy="30.5"
        rx="3.6"
        ry="4.9"
        fill="#fff"
        transform="rotate(24 40 30.5)"
      />
    </svg>
  );
}

function Paw({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="currentColor" aria-hidden="true">
      <ellipse cx="29" cy="40" rx="11" ry="9" />
      <ellipse cx="17" cy="30" rx="4.2" ry="5.6" transform="rotate(-24 17 30)" />
      <ellipse cx="25.5" cy="25.5" rx="4" ry="5.6" />
      <ellipse cx="34.5" cy="25.5" rx="4" ry="5.6" />
      <ellipse cx="42.5" cy="31" rx="4.2" ry="5.6" transform="rotate(24 42.5 31)" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    </svg>
  );
}

function IconList() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
    </svg>
  );
}

function IconCart() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M2 3h2l2.4 12.2a2 2 0 0 0 2 1.8h9.7a2 2 0 0 0 2-1.6L22 8H6" />
      <path d="M9 20a1 1 0 1 0 0 2 1 1 0 0 0 0-2ZM19 20a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

function IconTag({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12.6 2.6 21 11l-9.5 9.5a2 2 0 0 1-2.8 0L2 13.8V2h11.8Z" />
      <circle cx="7.5" cy="7.5" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Price comparison bar                                                */
/* ------------------------------------------------------------------ */

function PriceBar({ price, avg }: { price: number; avg: number }) {
  const max = avg * 1.35;
  const pricePct = Math.min(100, (price / max) * 100);
  const avgPct = Math.min(100, (avg / max) * 100);
  const savings = avg - price;
  return (
    <div>
      <div className="relative h-2 w-full rounded-full bg-slate-100">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-emerald-500"
          style={{ width: `${pricePct}%` }}
        />
        <div
          className="absolute -top-0.5 h-3 w-0.5 rounded-full bg-slate-400"
          style={{ left: `${avgPct}%` }}
          title="Nearby average price"
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-xs">
        <span className="font-semibold text-emerald-700">
          You save ${savings.toFixed(2)}
        </span>
        <span className="text-slate-500">nearby avg ${avg.toFixed(2)}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function Home() {
  const [zipInput, setZipInput] = useState("");
  const [zipError, setZipError] = useState<string | null>(null);
  const [activeZip, setActiveZip] = useState<string | null>(null);
  const resultsRef = useRef<HTMLElement | null>(null);

  // First-party analytics (anonymous product counts only). Fire one pageview
  // per mount. PRIVACY: POSTs {type:"pageview", visitorId} to /api/events —
  // no personal data, no cookies, no third parties; failures are swallowed.
  useEffect(() => {
    void trackEvent("pageview");
  }, []);

  // Count a zip-demo completion (with the searched zip) whenever the demo
  // results render for a zip. Same privacy contract as pageview.
  useEffect(() => {
    if (activeZip) {
      void trackEvent("zip_demo_complete", { zip: activeZip });
    }
  }, [activeZip]);

  function handleZipSubmit(e: FormEvent) {
    e.preventDefault();
    const z = zipInput.trim();
    if (!/^\d{5}$/.test(z)) {
      setZipError("Please enter a valid 5-digit zip code.");
      return;
    }
    setZipError(null);
    setActiveZip(z);
    requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  const demo = activeZip ? dealsForZip(activeZip) : null;

  return (
    <div className="min-h-dvh bg-white font-sans text-slate-900">
      <Header />
      <main id="top">
        <Hero
          zipInput={zipInput}
          setZipInput={setZipInput}
          zipError={zipError}
          onSubmit={handleZipSubmit}
          activeZip={activeZip}
        />
        {demo && (
          <ZipDemo
            resultsRef={resultsRef}
            zip={activeZip!}
            city={demo.city}
            groceries={demo.groceries}
            clearance={demo.clearance}
          />
        )}
        <LiveKrogerSection />
        <StoresNearYou />
        <PilotSection />
        <PetPilotSection />
        <HowItWorks />
        <Membership demoZip={activeZip} />
        <BetaSignup />
        <AdStrip />
        <Faq />
      </main>
      <Footer />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Header                                                              */
/* ------------------------------------------------------------------ */

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <a href="#top" className="flex items-center gap-2.5">
          <LogoMark className="h-9 w-9" />
          <span className="font-display text-xl font-bold tracking-tight text-slate-900">
            Price<span className="text-emerald-600">Hound</span>
          </span>
        </a>
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          <a href="#how" className="transition hover:text-slate-900">
            How it works
          </a>
          <a href="#membership" className="transition hover:text-slate-900">
            Membership
          </a>
          <a href="#faq" className="transition hover:text-slate-900">
            FAQ
          </a>
          <a href="#beta" className="transition hover:text-slate-900">
            Beta
          </a>
          <a
            href="#membership"
            className="rounded-full bg-emerald-600 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            Join waitlist
          </a>
        </nav>
        <a
          href="#membership"
          className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 md:hidden"
        >
          Join
        </a>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

function Hero({
  zipInput,
  setZipInput,
  zipError,
  onSubmit,
  activeZip,
}: {
  zipInput: string;
  setZipInput: (v: string) => void;
  zipError: string | null;
  onSubmit: (e: FormEvent) => void;
  activeZip: string | null;
}) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/90 via-white to-white">
      {/* decorative paws */}
      <Paw className="absolute -left-6 top-24 h-28 w-28 text-emerald-600/[0.07] md:h-40 md:w-40" />
      <Paw className="absolute right-10 top-10 h-16 w-16 text-emerald-600/[0.06]" />
      <Paw className="absolute bottom-8 right-1/4 hidden h-24 w-24 text-emerald-600/[0.06] lg:block" />

      <div className="relative mx-auto grid max-w-5xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 md:pb-24 md:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
        <div>
          <a
            href="#membership"
            className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute h-2 w-2 animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Pre-launch — join the waitlist
          </a>

          <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
            Find the lowest grocery prices{" "}
            <span className="text-emerald-600">near you</span>.
          </h1>

          <p className="mt-5 max-w-lg text-lg leading-relaxed text-slate-600">
            Enter your zip code and PriceHound sniffs out the best prices at
            local grocery stores — plus clearance markdowns on the stuff you
            actually want.
          </p>

          <form onSubmit={onSubmit} className="mt-8 w-full max-w-xl" noValidate>
            <div className="flex flex-col gap-3 sm:flex-row">
              <label htmlFor="zip" className="sr-only">
                Zip code
              </label>
              <input
                id="zip"
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={5}
                value={zipInput}
                onChange={(e) =>
                  setZipInput(e.target.value.replace(/\D/g, "").slice(0, 5))
                }
                placeholder="Enter your zip code, e.g. 94110"
                aria-invalid={zipError ? true : undefined}
                aria-describedby={zipError ? "zip-error" : undefined}
                className={`h-13 w-full flex-1 rounded-full border bg-white px-5 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:ring-4 sm:h-12 ${
                  zipError
                    ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                    : "border-slate-300 focus:border-emerald-500 focus:ring-emerald-100"
                }`}
              />
              <button
                type="submit"
                className="h-13 shrink-0 rounded-full bg-emerald-600 px-7 text-base font-semibold text-white shadow-md shadow-emerald-600/25 transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200 active:scale-[0.98] sm:h-12"
              >
                Sniff out deals
              </button>
            </div>
            {zipError && (
              <p
                id="zip-error"
                role="alert"
                className="mt-2.5 pl-5 text-sm font-medium text-red-600"
              >
                {zipError}
              </p>
            )}
          </form>

          <p className="mt-4 text-sm text-slate-500">
            {activeZip
              ? `Showing sample results for ${activeZip} — try another zip above.`
              : "No account needed · Free · Works on your phone · Try the sample view"}
          </p>
        </div>

        <HeroPreview />
      </div>
    </section>
  );
}

function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
      <div
        className="absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-emerald-200/50 via-transparent to-amber-200/50 blur-2xl"
        aria-hidden="true"
      />
      <div className="relative space-y-4 pt-4">
        <span className="absolute -top-1 right-2 z-10 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white shadow-lg">
          Sample
        </span>

        <div className="rotate-[-1.5deg] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/60">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-900">Whole milk · 1 gal</p>
              <p className="text-sm text-slate-500">FreshMart</p>
            </div>
            <p className="font-display text-2xl font-bold text-emerald-700">
              $2.49
            </p>
          </div>
          <div className="mt-3">
            <PriceBar price={2.49} avg={2.89} />
          </div>
        </div>

        <div className="relative rotate-[1.5deg] rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-xl shadow-amber-100/60">
          <span className="absolute -top-2.5 left-4 rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-bold text-amber-950">
            Clearance
          </span>
          <div className="flex items-start justify-between gap-3 pt-1">
            <div>
              <p className="font-semibold text-slate-900">55″ 4K Smart TV</p>
              <p className="text-sm text-slate-500">BigBox Outlet</p>
            </div>
            <div className="text-right">
              <p className="font-display text-2xl font-bold text-slate-900">
                $329
              </p>
              <p className="text-sm text-slate-400 line-through">$499</p>
            </div>
          </div>
          <p className="mt-2 inline-block rounded bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
            34% off
          </p>
        </div>

        <div className="rotate-[-0.75deg] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/60">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-900">Large eggs · dozen</p>
              <p className="text-sm text-slate-500">GreenGrocer</p>
            </div>
            <p className="font-display text-2xl font-bold text-emerald-700">
              $3.19
            </p>
          </div>
          <div className="mt-3">
            <PriceBar price={3.19} avg={3.79} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Zip demo results                                                    */
/* ------------------------------------------------------------------ */

function ZipDemo({
  resultsRef,
  zip,
  city,
  groceries,
  clearance,
}: {
  resultsRef: RefObject<HTMLElement | null>;
  zip: string;
  city?: string;
  groceries: GroceryDeal[];
  clearance: ClearanceDeal[];
}) {
  return (
    <section
      ref={resultsRef}
      aria-live="polite"
      className="scroll-mt-20 border-y border-slate-100 bg-slate-50/70 py-14 md:py-20"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="animate-rise flex items-start gap-3.5 rounded-2xl border border-amber-300/70 bg-amber-50 p-4 shadow-sm">
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber-400/90 text-amber-950">
            <IconTag />
          </span>
          <div>
            <p className="font-semibold text-amber-900">
              Sample data — fictional prices
            </p>
            <p className="mt-0.5 text-sm leading-relaxed text-amber-800/90">
              These are illustrative prices to show how PriceHound will work.
              Store names are fictional — for real prices, see the Live Kroger
              prices section below.
            </p>
          </div>
        </div>

        <div className="animate-rise-1 mt-8">
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Sample deals near {zip}
            {city ? (
              <span className="text-emerald-600"> · {city}</span>
            ) : null}
          </h2>
          <p className="mt-1.5 text-sm text-slate-500">
            Lowest grocery prices spotted nearby, compared with the area
            average — plus clearance finds.
          </p>
        </div>

        <h3 className="animate-rise-1 mt-10 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-slate-500">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Grocery deals
        </h3>
        <div className="animate-rise-1 mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groceries.map((d) => (
            <div
              key={`${d.item}-${d.store}`}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold leading-snug text-slate-900">
                    {d.item}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {d.qty} · {d.store}
                  </p>
                </div>
                <p className="font-display text-xl font-bold text-emerald-700">
                  ${d.price.toFixed(2)}
                </p>
              </div>
              <div className="mt-3">
                <PriceBar price={d.price} avg={d.avg} />
              </div>
            </div>
          ))}
        </div>

        <h3 className="animate-rise-2 mt-12 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-slate-500">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          Clearance finds
        </h3>
        <div className="animate-rise-2 mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {clearance.map((d) => {
            const pct = Math.round((1 - d.price / d.was) * 100);
            return (
              <div
                key={`${d.item}-${d.store}`}
                className="relative rounded-2xl border border-amber-200 bg-white p-4 pt-5 shadow-sm transition hover:shadow-md"
              >
                <span className="absolute -top-2.5 left-4 rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-bold text-amber-950">
                  Clearance
                </span>
                <p className="font-semibold leading-snug text-slate-900">
                  {d.item}
                </p>
                <p className="mt-0.5 text-sm text-slate-500">{d.store}</p>
                <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="font-display text-xl font-bold text-slate-900">
                    ${d.price}
                  </span>
                  <span className="text-sm text-slate-400 line-through">
                    ${d.was}
                  </span>
                  <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-bold text-red-700">
                    {pct}% off
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <p className="animate-rise-3 mt-8 text-xs text-slate-400">
          Prices, stores, and savings shown above are fictional sample data for
          this demo. Real pricing is live for Kroger in the pilot metro — see
          the Live Kroger prices section.
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Live Kroger prices — real data from Kroger's official API           */
/* ------------------------------------------------------------------ */

type LivePrice = {
  itemKey: string;
  label: string;
  description: string;
  priceRegular: number | null;
  pricePromo: number | null;
  fetchedAt: string;
};

type LivePricesResponse = {
  ok: boolean;
  prices: LivePrice[];
  fetchedAt: string | null;
  locationId: string | null;
  locationLabel: string | null;
  count: number;
};

function formatPriceDate(iso: string | null): string {
  if (!iso) return "recently";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "recently";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function LiveKrogerSection() {
  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading");
  const [data, setData] = useState<LivePricesResponse | null>(null);

  // Fetch the cached snapshot from the server (GET /api/prices reads the local
  // price cache — it never calls the Kroger API and exposes no credentials).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/prices");
        const body = (await res.json().catch(() => null)) as
          | LivePricesResponse
          | null;
        if (!cancelled) {
          if (res.ok && body?.ok && Array.isArray(body.prices)) {
            setData(body);
            setStatus("ready");
          } else {
            setStatus("error");
          }
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const location =
    data?.locationLabel ?? "100 E Court St, Cincinnati, OH";
  const hasPrices = data ? data.prices.length > 0 : false;

  return (
    <section
      id="live-prices"
      className="scroll-mt-20 bg-emerald-950 py-14 text-white md:py-20"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex items-start gap-3.5 rounded-2xl border border-emerald-400/30 bg-emerald-900/70 p-4 shadow-sm">
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-500 text-emerald-950">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute h-2.5 w-2.5 animate-ping rounded-full bg-emerald-300 opacity-75" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-950" />
            </span>
          </span>
          <div>
            <p className="font-semibold text-emerald-50">
              <span className="rounded bg-emerald-400 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-emerald-950">
                Real data
              </span>{" "}
              Live Kroger prices — Cincinnati, OH (45202)
            </p>
            <p className="mt-0.5 text-sm leading-relaxed text-emerald-200/80">
              Prices from Kroger's official API for the nearest store (
              {location}) — online pickup prices, may differ in-store.
            </p>
          </div>
        </div>

        <div className="animate-rise-1 mt-8">
          <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Live Kroger prices
          </h2>
          <p className="mt-1.5 text-sm text-emerald-200/70">
            Current prices on common groceries at the pilot store — fetched
            from Kroger's API, not estimated.
          </p>
        </div>

        {status === "loading" && (
          <p className="animate-rise-1 mt-6 text-sm text-emerald-200/80">
            Loading live prices…
          </p>
        )}

        {status === "error" && (
          <p className="animate-rise-1 mt-6 rounded-xl border border-emerald-800 bg-emerald-900/50 p-4 text-sm text-emerald-200/80">
            Live prices are temporarily unavailable — check back soon.
          </p>
        )}

        {status === "ready" && !hasPrices && (
          <div className="animate-rise-1 mt-6 rounded-xl border border-emerald-800 bg-emerald-900/50 p-5">
            <p className="font-semibold text-emerald-50">
              Prices refresh in progress
            </p>
            <p className="mt-1 text-sm leading-relaxed text-emerald-200/80">
              The first Kroger price crawl is running — real prices from the
              pilot store will appear here as soon as they're cached. Check
              back shortly.
            </p>
          </div>
        )}

        {status === "ready" && hasPrices && (
          <>
            <div className="animate-rise-1 mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data!.prices.map((p) => {
                const onPromo =
                  p.pricePromo != null &&
                  p.priceRegular != null &&
                  p.pricePromo < p.priceRegular;
                const shown = onPromo ? p.pricePromo : p.priceRegular;
                return (
                  <div
                    key={p.itemKey}
                    className="flex flex-col rounded-2xl border border-emerald-800 bg-emerald-900/50 p-4 shadow-sm transition hover:border-emerald-600 hover:shadow-md"
                  >
                    <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                      {p.label}
                    </p>
                    <p className="mt-1 flex-1 text-sm leading-snug text-emerald-100/90">
                      {p.description}
                    </p>
                    <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      {onPromo ? (
                        <>
                          <span className="font-display text-2xl font-bold text-amber-300">
                            ${p.pricePromo!.toFixed(2)}
                          </span>
                          <span className="text-sm text-emerald-300/60 line-through">
                            ${p.priceRegular!.toFixed(2)}
                          </span>
                          <span className="rounded bg-amber-400/20 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-300">
                            Sale
                          </span>
                        </>
                      ) : shown != null ? (
                        <span className="font-display text-2xl font-bold text-white">
                          ${shown.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-sm text-emerald-300/70">n/a</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="animate-rise-2 mt-6 text-xs text-emerald-300/60">
              Updated {formatPriceDate(data!.fetchedAt)} · Kroger online pickup
              prices for the nearest store; in-store shelf prices may differ.
            </p>
          </>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Stores near you — real Kroger locations                            */
/* ------------------------------------------------------------------ */

type NearbyStore = { locationId: string; name: string | null; chain: string | null; addressLine1: string | null; city: string | null; state: string | null; zipCode: string | null; lat: number | null; lng: number | null; phone: string | null; hours?: unknown };
type StoresResponse = { ok: boolean; zip: string; stores: NearbyStore[]; fetchedAt: string };

function StoresNearYou() {
  const [zip, setZip] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [data, setData] = useState<StoresResponse | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapObj = useRef<any>(null);
  const markerLayer = useRef<any>(null);
  async function search(e: FormEvent) {
    e.preventDefault();
    const value = zip.trim();
    if (!/^\d{5}$/.test(value)) return;
    setStatus("loading"); setSelected(null); void trackEvent("store_map_search", { zip: value });
    try { const res = await fetch(`/api/stores?zip=${value}`); const body = await res.json() as StoresResponse; if (!res.ok || !body.ok) throw new Error(); setData(body); setStatus("ready"); } catch { setStatus("error"); }
  }
  useEffect(() => {
    let cancelled = false;
    if (!data || !mapRef.current) return;
    (async () => {
      if (!(window as any).L) {
        if (!document.querySelector('link[data-leaflet]')) { const link = document.createElement("link"); link.rel = "stylesheet"; link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; link.dataset.leaflet = "true"; document.head.appendChild(link); }
        await new Promise<void>((resolve, reject) => { const s = document.createElement("script"); s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; s.onload = () => resolve(); s.onerror = () => reject(); document.head.appendChild(s); });
      }
      if (cancelled || !mapRef.current) return;
      const L = (window as any).L;
      if (!mapObj.current) { mapObj.current = L.map(mapRef.current).setView([39.10682, -84.51253], 12); L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: '&copy; OpenStreetMap contributors' }).addTo(mapObj.current); markerLayer.current = L.layerGroup().addTo(mapObj.current); }
      markerLayer.current.clearLayers();
      const valid = data.stores.filter((s) => s.lat != null && s.lng != null);
      if (valid.length) { mapObj.current.fitBounds(L.latLngBounds(valid.map((s) => [s.lat, s.lng])), { padding: [30, 30] }); valid.forEach((store) => { const marker = L.marker([store.lat, store.lng]).bindPopup(`<strong>${store.name ?? store.chain ?? "Kroger"}</strong><br>${store.addressLine1 ?? ""}`); marker.on("click", () => setSelected(store.locationId)); marker.addTo(markerLayer.current); }); }
      setTimeout(() => mapObj.current?.invalidateSize(), 50);
    })().catch(() => undefined);
    return () => { cancelled = true; };
  }, [data]);
  return <section id="stores" className="border-y border-emerald-100 bg-emerald-50/50 py-14 md:py-20"><div className="mx-auto max-w-5xl px-4 sm:px-6"><div className="flex items-start gap-3.5 rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-600 text-white">⌖</span><div><p className="font-semibold text-emerald-900"><span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">Real data</span>{" "}Kroger store locations via official API</p><p className="mt-0.5 text-sm text-emerald-800/80">Hours may vary; check with the store.</p></div></div><div className="mt-8"><h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Stores near you</h2><p className="mt-1.5 text-sm text-slate-500">Find real Kroger stores near any zip code.</p><form onSubmit={search} className="mt-5 flex max-w-xl flex-col gap-3 sm:flex-row"><input aria-label="Zip code for nearby stores" value={zip} onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))} placeholder="Enter a zip code, e.g. 45202" className="h-12 flex-1 rounded-full border border-slate-300 bg-white px-5 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" /><button className="h-12 rounded-full bg-emerald-600 px-7 font-semibold text-white shadow-sm hover:bg-emerald-700">Find stores</button></form></div>{status === "loading" && <p className="mt-6 text-sm text-slate-500">Finding nearby stores…</p>}{status === "error" && <p className="mt-6 text-sm text-red-600">Store locations are temporarily unavailable — try again soon.</p>}{status === "ready" && !data?.stores.length && <p className="mt-6 rounded-xl bg-white p-5 text-sm text-slate-600">No Kroger stores found near that zip — try a nearby city zip.</p>}{status === "ready" && !!data?.stores.length && <div className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]"><div ref={mapRef} className="h-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-200" aria-label="Map of nearby Kroger stores" /> <div className="space-y-3">{data.stores.map((s) => <button type="button" key={s.locationId} onClick={() => { setSelected(s.locationId); const valid = s.lat != null && s.lng != null; if (valid) mapObj.current?.setView([s.lat, s.lng], 14); }} className={`w-full rounded-2xl border bg-white p-4 text-left shadow-sm ${selected === s.locationId ? "border-emerald-500 ring-2 ring-emerald-100" : "border-slate-200"}`}><p className="font-semibold text-slate-900">{s.name ?? s.chain ?? "Kroger"}</p><p className="mt-1 text-sm text-slate-600">{s.addressLine1}, {s.city}, {s.state} {s.zipCode}</p>{s.phone && <p className="mt-1 text-sm text-emerald-700">{s.phone}</p>}{s.hours && typeof s.hours === "object" && (s.hours as any).monday && <p className="mt-1 text-xs text-slate-500">Hours: Mon {(s.hours as any).monday.open}–{(s.hours as any).monday.close}</p>}<p className="mt-2 text-xs text-slate-400">Store ID {s.locationId}</p></button>)}</div></div>}</div></section>;
}

/* ------------------------------------------------------------------ */
/* Live pilot — official weekly ads via Flipp (permission-free fallback) */
/* ------------------------------------------------------------------ */

function PilotSection() {
  // Fire-and-forget pilot engagement analytics: which chain's ad page was
  // opened, for which pilot zip. Anonymous; failures swallowed; never blocks
  // the navigation.
  function handlePilotClick(slug: string) {
    void trackEvent("pilot_link_click", { zip: PILOT_ZIP, chain: slug });
  }

  return (
    <section
      id="pilot"
      className="scroll-mt-20 border-y border-sky-100 bg-sky-50/60 py-14 md:py-20"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex items-start gap-3.5 rounded-2xl border border-sky-300/70 bg-sky-100/80 p-4 shadow-sm">
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sky-500 text-white">
            <IconShield />
          </span>
          <div>
            <p className="font-semibold text-sky-900">
              <span className="rounded bg-sky-600 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
                Live
              </span>{" "}
              Official weekly ads, via Flipp — {PILOT_LABEL}
            </p>
            <p className="mt-0.5 text-sm leading-relaxed text-sky-900/80">
              Flipp hosts each retailer's official weekly ad; PriceHound
              points you there and doesn't republish prices.
            </p>
          </div>
        </div>

        <div className="animate-rise-1 mt-8">
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Live pilot — {PILOT_LABEL} ({PILOT_ZIP})
          </h2>
          <p className="mt-1.5 text-sm text-slate-500">
            This week's official weekly-ad deals, hosted on Flipp for each
            retailer. We point you to the ad — we don't republish prices, and
            Flipp asks for your zip or region to show the local circular.
          </p>
        </div>

        <div className="animate-rise-1 mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PILOT_CHAINS.map((chain) => (
            <div
              key={chain.slug}
              className="flex flex-col rounded-2xl border border-sky-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-bold text-slate-900">
                    {chain.name}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-500">{chain.note}</p>
                </div>
                <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-sky-700">
                  Official
                </span>
              </div>
              <p className="mt-3 flex-1 text-xs leading-relaxed text-slate-500">
                {chain.detail}
              </p>
              <a
                href={chain.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                onClick={() => handlePilotClick(chain.slug)}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-200 active:scale-[0.98]"
              >
                View weekly ad
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M7 17 17 7M8 7h9v9" />
                </svg>
              </a>
            </div>
          ))}
        </div>

        <p className="animate-rise-2 mt-6 text-xs text-slate-400">
          These are real outbound links to each retailer's official weekly ad
          on Flipp — PriceHound does not scrape or republish ad content. Flipp
          may ask for a zip code or region when the page opens.
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Pet deals — pilot (link-out demand test)                            */
/* ------------------------------------------------------------------ */

function PetPilotSection() {
  // Fire-and-forget pet engagement analytics: which pet retailer's deals
  // page was opened. Anonymous; failures swallowed; never blocks navigation.
  function handlePetClick(slug: string) {
    void trackEvent("pet_link_click", { chain: slug });
  }

  return (
    <section
      id="pet-pilot"
      className="scroll-mt-20 border-b border-amber-100 bg-amber-50/40 py-10 md:py-14"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <h2 className="font-display text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          Pet deals — pilot
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm text-slate-500">
          PriceHound means hounding out the best price for your pets too.
          Testing pet-store deals — same honest links as the grocery pilot:
          we point to the store's own page, we don't republish prices.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PET_CHAINS.map((chain) => (
            <div
              key={chain.slug}
              className="flex flex-col rounded-2xl border border-amber-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-bold text-slate-900">
                    {chain.name}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-500">{chain.note}</p>
                </div>
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                  Official
                </span>
              </div>
              <p className="mt-3 flex-1 text-xs leading-relaxed text-slate-500">
                {chain.detail}
              </p>
              <a
                href={chain.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                onClick={() => handlePetClick(chain.slug)}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 focus:outline-none focus:ring-4 focus:ring-amber-200 active:scale-[0.98]"
              >
                View pet deals
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M7 17 17 7M8 7h9v9" />
                </svg>
              </a>
            </div>
          ))}
        </div>

        <p className="mt-5 text-xs text-slate-400">
          Real outbound links to each retailer's official deals page —
          PriceHound does not scrape or republish ad content. More pet
          retailers will be added as their pages are verified.
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* How it works                                                        */
/* ------------------------------------------------------------------ */

function HowItWorks() {
  const steps = [
    {
      n: "1",
      title: "Enter your zip",
      body: "Tell us where you shop — no account needed. PriceHound focuses on the stores in your area.",
    },
    {
      n: "2",
      title: "We compare prices",
      body: "PriceHound checks local grocery stores and retailers for the lowest prices on the items you buy, plus clearance markdowns.",
    },
    {
      n: "3",
      title: "You shop smarter",
      body: "See the best prices in one place, spot clearance steals early, and spend less on every trip.",
    },
  ];
  return (
    <section id="how" className="scroll-mt-20 py-14 md:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-wider text-emerald-600">
            How it works
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Less price-hunting, more sniffing out savings
          </h2>
          <p className="mt-3 text-lg text-slate-600">
            PriceHound does the legwork of comparing prices, so you don't have
            to hop between store sites and ads.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.n}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="grid h-11 w-11 place-items-center rounded-full bg-emerald-100 font-display text-lg font-bold text-emerald-700">
                {s.n}
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-slate-900">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Membership + waitlist                                               */
/* ------------------------------------------------------------------ */

function Membership({ demoZip = null }: { demoZip?: string | null }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showOpeningSoon, setShowOpeningSoon] = useState(false);

  async function handleJoin(e: FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // If the visitor ran the zip demo, attach that zip so demand can be
        // measured per metro. Omitted entirely when they haven't entered one.
        body: JSON.stringify({ email: value, zip: demoZip ?? undefined }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;
      if (!res.ok || !data?.ok) {
        setError(data?.error ?? "Something went wrong — please try again.");
        setSubmitting(false);
        return;
      }
      setSubmitting(false);
      setJoined(value);
      // First-party analytics: count the signup (with the demo zip if the
      // visitor ran the demo). Anonymous; failures swallowed.
      void trackEvent("waitlist_signup", { zip: demoZip ?? undefined });
    } catch {
      setError("Something went wrong — please try again.");
      setSubmitting(false);
    }
  }

  const benefits = [
    {
      icon: <IconShield />,
      title: "Ad-free experience",
      body: "Planned Plus benefit: compare prices without retailer or brand ads.",
    },
    {
      icon: <IconList />,
      title: "Grocery lists (coming soon)",
      body: "Planned tools for building lists with prices attached and seeing where items are cheapest.",
    },
    {
      icon: <IconCart />,
      title: "Automatic ordering (coming soon)",
      body: "Planned one-tap reordering for your usual items at the lowest current price.",
    },
    {
      icon: <IconClock />,
      title: "Scheduled deliveries (coming soon)",
      body: "Planned delivery scheduling so groceries arrive when you want them.",
    },
  ];

  return (
    <section
      id="membership"
      className="scroll-mt-20 border-y border-slate-100 bg-slate-50/70 py-14 md:py-20"
    >
      <div className="mx-auto grid max-w-5xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-14">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-emerald-600">
            PriceHound Plus
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Join PriceHound Plus — $3.99/month
          </h2>
          <p className="mt-3 text-lg leading-relaxed text-slate-600">
            Plus is planned as an ad-free experience with tools that turn saved
            prices into saved time. Membership is opening soon; join the
            waitlist to be first in line.
          </p>

          <ul className="mt-8 space-y-5">
            {benefits.map((b) => (
              <li key={b.title} className="flex gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                  {b.icon}
                </span>
                <div>
                  <p className="font-semibold text-slate-900">{b.title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-slate-600">
                    {b.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:pt-2">
          <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-xl shadow-emerald-900/5">
            <div className="bg-emerald-600 px-6 py-5 text-white">
              <div className="flex items-center justify-between gap-3">
                <p className="font-display text-lg font-bold">PriceHound Plus</p>
                <Paw className="h-7 w-7 text-white/80" />
              </div>
              <p className="mt-2 font-display text-4xl font-extrabold">
                $3.99
                <span className="text-base font-semibold text-emerald-100">
                  /month
                </span>
              </p>
              <p className="mt-1 text-sm text-emerald-100">
                Planned benefits · Ad-free · Grocery lists · Ordering · Delivery
              </p>
            </div>

            <div className="p-6">
              {PLUS_PAYMENT_LINK ? (
                <a
                  href={PLUS_PAYMENT_LINK}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="flex h-12 w-full items-center justify-center rounded-xl bg-emerald-600 px-4 text-center font-semibold text-white shadow-md shadow-emerald-600/25 transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200 active:scale-[0.99]"
                >
                  Join PriceHound Plus — $3.99/month
                </a>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setShowOpeningSoon(true);
                      document.getElementById("waitlist-form")?.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                    }}
                    className="flex h-12 w-full items-center justify-center rounded-xl bg-emerald-600 px-4 text-center font-semibold text-white shadow-md shadow-emerald-600/25 transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200 active:scale-[0.99]"
                  >
                    Join PriceHound Plus — $3.99/month
                  </button>
                  {showOpeningSoon && (
                    <p
                      role="status"
                      className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-relaxed text-amber-900"
                    >
                      Membership is opening soon — join the waitlist to be first
                      in line. There is no charge today.
                    </p>
                  )}
                </>
              )}

              {joined ? (
                <div
                  role="status"
                  className="animate-rise rounded-2xl border border-emerald-200 bg-emerald-50 p-5"
                >
                  <p className="flex items-center gap-2 font-semibold text-emerald-800">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-600 text-white">
                      <IconCheck />
                    </span>
                    You're on the list!
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-emerald-900/80">
                    We'll reach out to{" "}
                    <span className="font-semibold">{joined}</span> when
                    PriceHound Plus launches. No spam, and you can change your
                    mind anytime.
                  </p>
                </div>
              ) : (
                <>
                  <p className="font-semibold text-slate-900">
                    Join the Plus waitlist
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Sign up to be first in line when membership opens. No
                    charge today.
                  </p>
                  <form id="waitlist-form" onSubmit={handleJoin} className="mt-4" noValidate>
                    <label htmlFor="waitlist-email" className="sr-only">
                      Email address
                    </label>
                    <input
                      id="waitlist-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      aria-invalid={error ? true : undefined}
                      aria-describedby={error ? "waitlist-error" : undefined}
                      className={`h-12 w-full rounded-xl border bg-white px-4 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                        error
                          ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                          : "border-slate-300 focus:border-emerald-500 focus:ring-emerald-100"
                      }`}
                    />
                    {error && (
                      <p
                        id="waitlist-error"
                        role="alert"
                        className="mt-2 text-sm font-medium text-red-600"
                      >
                        {error}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="mt-3 h-12 w-full rounded-xl bg-emerald-600 font-semibold text-white shadow-md shadow-emerald-600/25 transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {submitting ? "Joining…" : "Join the waitlist"}
                    </button>
                  </form>
                  <p className="mt-3 text-center text-xs text-slate-400">
                    $3.99/month · Cancel anytime · Free tier stays free
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Beta signup                                                         */
/* ------------------------------------------------------------------ */
function BetaSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [error, setError] = useState<string | null>(null);
  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setError(null);
    const clean = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) { setError("Please enter a valid email address."); return; }
    setStatus("submitting");
    try {
      const res = await fetch("/api/beta", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: clean }) });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Please try again.");
      setStatus("success");
    } catch (err) { setStatus("idle"); setError(err instanceof Error ? err.message : "Could not save your signup. Please try again."); }
  }
  return <section id="beta" className="scroll-mt-20 border-y border-emerald-100 bg-emerald-50/60 py-14 md:py-20">
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <div className="grid gap-8 rounded-3xl border border-emerald-200 bg-white p-7 shadow-sm md:grid-cols-[1.1fr_0.9fr] md:p-10">
        <div><p className="text-sm font-bold uppercase tracking-wider text-emerald-600">Coming with Google Play</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Join the PriceHound beta</h2>
          <p className="mt-3 text-lg leading-relaxed text-slate-600">Help shape PriceHound. Beta testers get free access to the whole app, and the fixes and features you ask for go straight into the updates.</p>
          <ul className="mt-6 space-y-3 text-sm text-slate-700"><li>• Free access to the whole app during the beta</li><li>• Your feedback shapes what we fix and build next</li><li>• You&apos;ll be first to new features</li></ul>
        </div>
        <div className="rounded-2xl bg-slate-50 p-5 sm:p-6">{status === "success" ? <p role="status" className="py-8 text-center font-semibold text-emerald-700">You&apos;re on the beta list — watch your inbox for the install link.</p> : <form onSubmit={handleSubmit} noValidate><label htmlFor="beta-email" className="text-sm font-semibold text-slate-800">Email address</label><input id="beta-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" className={`mt-2 h-12 w-full rounded-xl border bg-white px-4 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 ${error ? "border-red-400" : "border-slate-300"}`} aria-describedby={error ? "beta-error" : undefined} />{error && <p id="beta-error" role="alert" className="mt-2 text-sm font-medium text-red-600">{error}</p>}<button type="submit" disabled={status === "submitting"} className="mt-3 h-12 w-full rounded-xl bg-emerald-600 font-semibold text-white shadow-md shadow-emerald-600/25 hover:bg-emerald-700 disabled:opacity-70">{status === "submitting" ? "Saving…" : "Get on the beta list"}</button></form>}<p className="mt-4 text-center text-xs leading-relaxed text-slate-400">Install links go out via Google Play when the beta opens — we&apos;ll email yours. No spam, no charges, unsubscribe anytime.</p></div>
      </div>
    </div>
  </section>;
}
/* ------------------------------------------------------------------ */
/* Advertising strip                                                   */
/* ------------------------------------------------------------------ */

function AdStrip() {
  return (
    <section className="bg-emerald-900 py-10 text-white">
      <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-800/80 px-3 py-1 text-xs font-semibold text-emerald-200">
          <IconTag className="h-3.5 w-3.5" />
          Free tier
        </span>
        <h2 className="mx-auto mt-3 max-w-2xl font-display text-2xl font-bold tracking-tight sm:text-3xl">
          The free tier shows ads from local retailers and brands
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-emerald-100/85 sm:text-base">
          That's what keeps PriceHound at $0 — you see relevant ads from stores
          and brands in your area, and you can remove them anytime with the
          $3.99/month membership.
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ                                                                 */
/* ------------------------------------------------------------------ */

function Faq() {
  const items = [
    {
      q: "Is this real data?",
      a: "The sample view above is fictional demo data. The 'Live Kroger prices' section is real: current prices fetched from Kroger's official API for the pilot store in Cincinnati, OH. We label provenance honestly — online pickup prices can differ from in-store shelf prices.",
    },
    {
      q: "How will PriceHound find prices?",
      a: "PriceHound will regularly check grocery stores' and retailers' published prices and weekly ads, then compare them for your zip code — so you see the lowest price without visiting a dozen sites.",
    },
    {
      q: "How is PriceHound free?",
      a: "The free tier is supported by ads from local retailers and brands. PriceHound Plus is $3.99/month for an ad-free experience plus grocery lists, automatic ordering, and scheduled deliveries.",
    },
    {
      q: "Which stores will be covered?",
      a: "We'll launch with the major grocery chains and big-box retailers, then add local markets and independent shops. Launch cities will be announced here.",
    },
  ];
  return (
    <section id="faq" className="scroll-mt-20 py-14 md:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-wider text-emerald-600">
            FAQ
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Questions, answered
          </h2>
        </div>

        <div className="mt-10 space-y-4">
          {items.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition open:shadow-md"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
                <span>{item.q}</span>
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-100 text-lg font-bold leading-none text-emerald-700 transition-transform duration-200 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Footer                                                              */
/* ------------------------------------------------------------------ */

function Footer() {
  return (
    <footer className="bg-emerald-950 text-emerald-100/70">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div>
            <a href="#top" className="flex items-center gap-2.5">
              <LogoMark className="h-9 w-9" />
              <span className="font-display text-xl font-bold tracking-tight text-white">
                Price<span className="text-emerald-400">Hound</span>
              </span>
            </a>
            <p className="mt-3 max-w-xs text-sm leading-relaxed">
              Sniffing out the best prices in your neighborhood — one zip code
              at a time.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <div>
              <p className="font-semibold text-white">Product</p>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <a href="#how" className="transition hover:text-white">
                    How it works
                  </a>
                </li>
                <li>
                  <a href="#top" className="transition hover:text-white">
                    Zip demo
                  </a>
                </li>
                <li>
                  <a href="#membership" className="transition hover:text-white">
                    Membership
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-white">Company</p>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <a href="#membership" className="transition hover:text-white">
                    Join the waitlist
                  </a>
                </li>
                <li>
                  <a href="#faq" className="transition hover:text-white">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="/privacy" className="transition hover:text-white">
                    Privacy policy
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-emerald-800/60 pt-6 text-xs leading-relaxed">
          <p>© 2026 PriceHound. All rights reserved.</p>
          <p className="mt-1.5 text-emerald-100/50">
            Sample prices and store names on this page are fictional demo data.
            The Live Kroger prices section shows real prices from Kroger's
            official API for the Cincinnati pilot — more stores are coming.
          </p>
        </div>
      </div>
    </footer>
  );
}
