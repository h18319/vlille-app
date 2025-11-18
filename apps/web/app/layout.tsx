import Script from "next/script";
import { cookies } from "next/headers";

import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "./globals.css";



export const metadata: Metadata = {
  title: "V’Lille Maps",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ⬇️ cookies() est async dans ta version
  const cookieStore = await cookies();
  const themeCookie =
    (cookieStore.get("theme")?.value as "light" | "dark" | undefined) ??
    undefined;

  return (
    <html lang="fr" data-theme={themeCookie} suppressHydrationWarning>
      <head>
        {/* Si pas de cookie (1ère visite), on décide avant hydratation */}
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            try {
              var html = document.documentElement;
              if (!html.hasAttribute('data-theme')) {
                var ls = localStorage.getItem('theme');
                var sys = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                var t = (ls === 'dark' || ls === 'light') ? ls : sys;
                html.setAttribute('data-theme', t);
              }
            } catch {}
          `}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  );
}