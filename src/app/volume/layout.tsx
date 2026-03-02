import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '거래량 - 시도별 아파트 거래량 추이',
  description:
    '시도별 아파트 매매 · 전월세 거래량 추이를 히트맵과 차트로 확인하세요.',
  alternates: { canonical: '/volume' },
};

export default function VolumeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
