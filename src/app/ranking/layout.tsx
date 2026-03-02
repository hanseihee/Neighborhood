import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '티어 - 시군구/아파트 가격 랭킹',
  description:
    '시군구 및 아파트별 매매가 · 전세 보증금 랭킹을 티어로 확인하세요.',
  alternates: { canonical: '/ranking' },
};

export default function RankingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
