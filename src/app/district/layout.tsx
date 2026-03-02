import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '시군구 비교 - 시군구별 아파트 시세 비교',
  description:
    '시군구별 아파트 매매가 · 전세 보증금을 비교하고 월별 시세 추이를 분석하세요.',
  alternates: { canonical: '/district' },
};

export default function DistrictLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
