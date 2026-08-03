import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";

export const Route = createFileRoute("/privacy")({ component: PrivacyPolicy });

function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-800 sm:px-6">
      <article className="mx-auto max-w-3xl rounded-3xl bg-white p-7 shadow-sm ring-1 ring-slate-200 sm:p-12">
        <a href="/" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">← Back to PriceHound</a>
        <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-slate-950">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: August 2, 2026</p>
        <p className="mt-7 leading-7">PriceHound helps shoppers compare grocery prices and find store deals. This policy explains what we collect on this website and how we use it. We do not sell personal information.</p>
        <Section title="Information you choose to provide"><p>When you use our zip-code demo, we receive the five-digit zip code you submit so we can show the relevant demo or pilot view. When you join the waitlist, we collect your email address so we can contact you about PriceHound. If you join the beta list, we collect your email address to invite you when the beta opens and send the Google Play install link. Joining is optional; you can ask us to remove your address by contacting the team via this site.</p></Section>
        <Section title="Anonymous analytics"><p>We use first-party, anonymous analytics to understand whether the site is useful. Events may include the event type (such as pageview, zip-demo completion, waitlist signup, or a store-link click), a random anonymous visitor ID kept in your browser&apos;s local storage, the zip code associated with an action, and the selected store chain for a store-link click. We store a server timestamp. We do not use cookies, fingerprinting, third-party analytics scripts, IP addresses, user agents, or cross-site tracking for these events. Analytics are used in aggregate to improve the product.</p></Section>
        <Section title="Prices and store links"><p>For the Cincinnati pilot, PriceHound fetches product prices from Kroger&apos;s official API on our server and caches them with fetch timestamps. API credentials stay server-side and are never included in the client bundle. Prices are labeled as Kroger online pickup prices and may differ in-store. We also link out to retailers&apos; own weekly-ad pages (including Kroger, Aldi, Target, Walmart, and Meijer). Those links take you to the retailer; PriceHound points to these pages and does not republish their weekly-ad content.</p></Section>
        <Section title="Payments"><p>Our optional PriceHound Plus checkout is hosted by Stripe. The current offer is a one-time $3.99 purchase with manual renewal, not an auto-renewing subscription. Stripe processes payment information; PriceHound does not receive or store your card number. Stripe&apos;s own privacy policy and terms apply to information you provide on its checkout page.</p></Section>
        <Section title="Service providers and retention"><p>Waitlist and beta-list emails and anonymous analytics are stored on the PriceHound service for demand validation and product operations. We retain them only as long as reasonably needed for those purposes, or until you request deletion where applicable. We may use hosting and infrastructure providers to operate the site. We do not sell data or use it for targeted advertising.</p></Section>
        <Section title="Your choices and contact"><p>You may choose not to submit a zip code or join the waitlist. You can clear the anonymous visitor ID by clearing this site&apos;s local storage. To ask about, correct, or delete your waitlist or beta-list information, contact the team via this site. We will update this policy when our data practices materially change.</p></Section>
      </article>
    </main>
  );
}
function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className="mt-8"><h2 className="font-display text-xl font-bold text-slate-950">{title}</h2><div className="mt-2 leading-7 text-slate-600">{children}</div></section>;
}
