import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '얼마집 - 아파트 실거래가 · 전월세',
    short_name: '얼마집',
    description:
      '국토교통부 공공데이터 기반 아파트 실거래가 조회 · 전월세 시세 비교',
    start_url: '/',
    display: 'standalone',
    background_color: '#F8FAFB',
    theme_color: '#0D9488',
    icons: [
      {
        src: '/icon',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}
