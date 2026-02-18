import type { MetadataRoute } from 'next';
import { TOKYO_MUNICIPALITIES } from '@hikkoshimap/shared';
import { getAllStations, getAllAreas, getLinesList } from '@/lib/db';
import { SITE_URL } from '@/lib/site';
import { lineNameToSlug } from '@/lib/line-slug';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [stations, areas, lines] = await Promise.all([
    getAllStations(),
    getAllAreas(),
    getLinesList(),
  ]);

  const lastModified = new Date().toISOString();

  const cityPages: MetadataRoute.Sitemap = TOKYO_MUNICIPALITIES.map((m) => ({
    url: `${SITE_URL}/city/${m.nameEn}`,
    lastModified,
    changeFrequency: 'monthly' as const,
    priority: 0.9,
  }));

  const stationPages: MetadataRoute.Sitemap = stations.map((s) => ({
    url: `${SITE_URL}/station/${(s as { nameEn: string }).nameEn}`,
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  const areaPages: MetadataRoute.Sitemap = areas.map((a) => ({
    url: `${SITE_URL}/area/${(a as { nameEn: string }).nameEn}`,
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  const linePages: MetadataRoute.Sitemap = lines.map((l) => ({
    url: `${SITE_URL}/line/${lineNameToSlug(l.name)}`,
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.85,
  }));

  return [
    {
      url: SITE_URL,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/line`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    ...cityPages,
    ...linePages,
    ...stationPages,
    ...areaPages,
  ];
}
