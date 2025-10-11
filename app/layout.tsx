'use client';

import localFont from "next/font/local";
import "./globals.css";
import "yet-another-react-lightbox/styles.css";
import Script from "next/script";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DynamicTitle from "../components/DynamicTitle";
import { FIREBASE_APP } from "../firebase/firebase-config";
// import { useTimeGradient } from "../components/useTimeGradient"; // gradient disabled

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
   Analytics
--------------------------- */
const GA_TRACKING_ID = "AIzaSyDfjB5O8yxpzGv1reOb0wz5rZdWZbXm37I";

/* ---------------------------
   Root Layout (Client)
--------------------------- */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  // const gradient = useTimeGradient(); // disabled

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/assets/favicon-96x96.png" />
        <title>𝐓 | 𝐍 | 𝐃 | 𝐑 | 𝐁 | 𝐓 | 𝐍 | 𝐒</title>

        {/* Preload fonts */}
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

        {/* Gradient script disabled */}
        {/*
        <Script id="time-gradient" strategy="beforeInteractive">
          {`/* disabled */`}
        </Script>
        */}
      </head>

      <body className={`${graphik.className} ${tiempos.variable}`}>
        <DynamicTitle />

        {/* ✅ children are inside main; no forced 100 vh spacing */}
        <main>
          {children}
          <ToastContainer />
        </main>

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
