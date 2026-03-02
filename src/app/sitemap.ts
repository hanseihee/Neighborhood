import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';
import { REGIONS } from '@/lib/constants';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // 메인 페이지
  const mainPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/find`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/metro`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/district`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/volume`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/ranking`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/ranking/apartment`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
  ];

  // 시도별 시세 페이지 (/?region=CODE 형태)
  const regionPages: MetadataRoute.Sitemap = REGIONS.flatMap((region) =>
    region.districts.map((district) => ({
      url: `${SITE_URL}/?region=${district.code}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.6,
    })),
  );

  return [...mainPages, ...regionPages];
}
