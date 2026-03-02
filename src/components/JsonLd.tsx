import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from '@/lib/site';

export function WebApplicationJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    applicationCategory: 'RealEstate',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'KRW' },
    inLanguage: 'ko',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function DatasetJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: '아파트 매매 실거래가 · 전월세',
    description:
      '국토교통부 공공데이터포털 제공 아파트 매매 실거래가 및 전월세 상세 자료',
    url: SITE_URL,
    license: 'https://www.kogl.or.kr/info/license.do#702',
    creator: {
      '@type': 'Organization',
      name: '국토교통부',
    },
    distribution: {
      '@type': 'DataDownload',
      encodingFormat: 'application/json',
      contentUrl: 'https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev',
    },
    temporalCoverage: '2006/..',
    spatialCoverage: {
      '@type': 'Place',
      name: '대한민국',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
