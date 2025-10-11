import localFont from "next/font/local";
import "./globals.css";
import "yet-another-react-lightbox/styles.css";
import "react-toastify/dist/ReactToastify.css";
import Script from "next/script";
import ClientShell from "../components/ClientShell"; // new small wrapper

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

const GA_TRACKING_ID = "AIzaSyDfjB5O8yxpzGv1reOb0wz5rZdWZbXm37I";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
      </head>

      <body className={`${graphik.className} ${tiempos.variable}`}>
        {/* Client-only logic lives inside this component */}
        <ClientShell>{children}</ClientShell>

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
