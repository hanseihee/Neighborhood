import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '아파트 찾기 - 예산별 아파트 검색',
  description:
    '예산 범위와 지역을 설정하여 조건에 맞는 아파트를 평형대별로 검색하세요. 매매 · 전월세 지원.',
  alternates: { canonical: '/find' },
};

export default function FindLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
