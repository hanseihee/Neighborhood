import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Providers from '@/components/Providers';
import { WebApplicationJsonLd, DatasetJsonLd } from '@/components/JsonLd';
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from '@/lib/site';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - 아파트 실거래가 · 전월세`,
    template: `${SITE_NAME} - %s`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: SITE_NAME,
    title: `${SITE_NAME} - 아파트 실거래가 · 전월세`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} - 아파트 실거래가 · 전월세`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  verification: {
    google: '8oQ2PTTag4mUsIU2arE1p1wcL4-Y0cYuyStPV46jfkg',
  },
  alternates: { canonical: '/' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-H5KHGNSS85"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-H5KHGNSS85');
          `}
        </Script>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4582716621646848"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <WebApplicationJsonLd />
        <DatasetJsonLd />
      </head>
      <body className="min-h-screen">
        <Providers>
          <Header />
          <main className="max-w-[1400px] mx-auto px-5 sm:px-8 pt-6 pb-16">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
