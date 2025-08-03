'use client';
import { Inter } from "next/font/google";
import "./globals.css";
import "yet-another-react-lightbox/styles.css";
import Script from "next/script";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DynamicTitle from '../components/DynamicTitle';
import { FIREBASE_APP } from "../firebase/firebase-config";
import type { Metadata } from "next";
import { useTimeGradient } from '../components/useTimeGradient';


const inter = Inter({ subsets: ["latin"] });

const GA_TRACKING_ID = "AIzaSyDfjB5O8yxpzGv1reOb0wz5rZdWZbXm37I";

const metadata: Metadata = {
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
      { url: "/assets/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/assets/favicon-16x16.png", sizes: "16x16", type: "image/png" },
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


export default function RootLayout({ children }) {

  const gradient = useTimeGradient(); 

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* favicon */}
        <link rel="icon" href="/assets/favicon-32x32.png" />
        <title>{`𝐓 | 𝐍 | 𝐃 | 𝐑 | 𝐁 | 𝐓 | 𝐍 | 𝐒`}</title>
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
      <body className={inter.className}>
        {/*<div className={`min-h-screen ${gradient ?? ''}`}>*/}

        <DynamicTitle /> 
        <main>
          <ToastContainer />
        </main>

        {children}

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
                {/* </div> */}
      </body>
    </html>
  );
}
