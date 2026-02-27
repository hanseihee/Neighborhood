import type { Metadata } from 'next';
import Header from '@/components/Header';
import './globals.css';

export const metadata: Metadata = {
  title: '아파트 실거래가 | 국토교통부 공공데이터',
  description:
    '국토교통부 실거래가 공공데이터 API 기반 아파트 매매 실거래가 조회 · 가격 추이 분석',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-screen">
        <Header />
        <main className="max-w-[1400px] mx-auto px-5 sm:px-8 pt-6 pb-16">
          {children}
        </main>
      </body>
    </html>
  );
}
