import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import appCss from "~/styles/app.css?url";

// PriceHound logo mark: an emerald price tag with a paw print, as an inline
// SVG data URI so the favicon needs no extra request.
const FAVICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect x='4' y='4' width='56' height='56' rx='16' fill='%23059669'/%3E%3Ccircle cx='46' cy='17' r='5.5' fill='%23fff'/%3E%3Cellipse cx='29' cy='40' rx='10' ry='8.5' fill='%23fff'/%3E%3Cellipse cx='18' cy='30.5' rx='3.6' ry='4.9' fill='%23fff' transform='rotate(-24 18 30.5)'/%3E%3Cellipse cx='25.5' cy='26' rx='3.5' ry='4.9' fill='%23fff'/%3E%3Cellipse cx='33' cy='26' rx='3.5' ry='4.9' fill='%23fff'/%3E%3Cellipse cx='40' cy='30.5' rx='3.6' ry='4.9' fill='%23fff' transform='rotate(24 40 30.5)'/%3E%3C/svg%3E";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      {
        title: "PriceHound — Find the lowest grocery prices near you",
      },
      {
        name: "description",
        content:
          "PriceHound compares grocery prices and clearance deals near you by zip code. Enter your zip to see the lowest prices in your area. Free with ads, or ad-free with PriceHound Plus at $3.99/month.",
      },
      {
        property: "og:title",
        content: "PriceHound — Find lower grocery prices near you",
      },
      {
        property: "og:description",
        content:
          "Enter your zip code to compare grocery prices and find deals near you. Pre-launch: sample demo plus live Kroger prices from Cincinnati.",
      },
      { property: "og:type", content: "website" },
      {
        property: "og:image",
        content: "https://409c3b75777e2a034c608e75c5233042.ctonew.app/og-image.png",
      },
      {
        property: "og:url",
        content: "https://409c3b75777e2a034c608e75c5233042.ctonew.app/",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#059669" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: FAVICON },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@600;700;800&display=swap",
      },
    ],
  }),
  notFoundComponent: () => <div>Page not found</div>,
  component: RootComponent,
});

function RootComponent() {
  // Registration is intentionally best-effort: a browser without SW support
  // must behave exactly like the normal SSR site.
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);

  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
