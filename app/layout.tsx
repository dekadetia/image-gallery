'use client';

import localFont from "next/font/local";
import "./globals.css";
import "yet-another-react-lightbox/styles.css";
import Script from "next/script";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DynamicTitle from "../components/DynamicTitle";
import { FIREBASE_APP } from "../firebase/firebase-config";
import type { Metadata } from "next";
import { useTimeGradient } from "../components/useTimeGradient";

/* ---------------------------
   Local font optimization
--------------------------- */
const graphik = localFont({
  src: "./../public/fonts/graphik-web.woff",
  variable: "--font-graphik",
  display: "swap",
});

const tiempos = localFont({
  src: "./../public/fonts/TiemposText-Semibold.otf",
  variable: "--font-tiempos",
  display: "swap",
});

/* ---------------------------
   Site metadata
--------------------------- */
export const metadata: Metadata = {
  title: `𝐓 | 𝐍 | 𝐃 | 𝐑 | 𝐁 | 𝐓 | 𝐍 | 𝐒`,
  description: "A screenshot diary",
  icons: {
    apple: [
      {
        url: "/assets/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    icon: [
      { url: "/assets/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    other: [
      { rel: "manifest", url: "/assets/site.webmanifest" },
      {
        rel: "mask-icon",
        url: "/assets/safari-pinned-tab.svg",
        color: "#15181b",
      },
    ],
  },
  themeColor: "#15181b",
  other: {
    "msapplication-TileColor": "#00aba9",
  },
};

/* ---------------------------
   Analytics
--------------------------- */
const GA_TRACKING_ID = "AIzaSyDfjB5O8yxpzGv1reOb0wz5rZdWZbXm37I";

/* ---------------------------
   Root Layout
--------------------------- */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gradient = useTimeGradient();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Favicons */}
        <link rel="icon" href="/assets/favicon-96x96.png" />

        {/* Preload fallback for non-JS or crawlers */}
        <link
          rel="preload"
          href="/fonts/graphik-web.woff"
          as="font"
          type="font/woff"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/TiemposText-Semibold.otf"
          as="font"
          type="font/otf"
          crossOrigin="anonymous"
        />

        <title>{`𝐓 | 𝐍 | 𝐃 | 𝐑 | 𝐁 | 𝐓 | 𝐍 | 𝐒`}</title>

        {/* Time-of-day gradient initialization */}
        <Script id="time-gradient" strategy="beforeInteractive">
          {`
            const h = new Date().getHours();
            const t = h < 6 ? 'night'
                      : h < 12 ? 'morning'
                      : h < 18 ? 'day'
                      : h < 22 ? 'dusk'
                      : 'night';
            document.documentElement.classList.add(t);
          `}
        </Script>
      </head>

      <body className={`${graphik.className} ${tiempos.variable}`}>
        {/* Optional dynamic title / animation */}
        <DynamicTitle />

        <main>
          <ToastContainer />
        </main>

        {children}

        {/* Google Analytics */}
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_TRACKING_ID}', {
              page_path: window.location.pathname,
            });
          `}
        </Script>
      </body>
    </html>
  );
}
