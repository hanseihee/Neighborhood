import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '시도 비교 - 시도별 아파트 시세 비교',
  description:
    '전국 시도별 아파트 매매가 · 전세 보증금을 비교하고 월별 시세 추이를 확인하세요.',
  alternates: { canonical: '/metro' },
};

export default function MetroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
