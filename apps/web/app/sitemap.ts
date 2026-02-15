import type { MetadataRoute } from 'next';
import { TOKYO_MUNICIPALITIES } from '@hikkoshinoise/shared';
import { getAllStations, getAllAreas } from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [stations, areas] = await Promise.all([
    getAllStations(),
    getAllAreas(),
  ]);

  const cityPages: MetadataRoute.Sitemap = TOKYO_MUNICIPALITIES.map((m) => ({
    url: `https://hikkoshinoise.com/city/${m.nameEn}`,
    changeFrequency: 'monthly' as const,
    priority: 0.9,
  }));

  const stationPages: MetadataRoute.Sitemap = stations.map((s) => ({
    url: `https://hikkoshinoise.com/station/${(s as { nameEn: string }).nameEn}`,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  const areaPages: MetadataRoute.Sitemap = areas.map((a) => ({
    url: `https://hikkoshinoise.com/area/${(a as { nameEn: string }).nameEn}`,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [
    {
      url: 'https://hikkoshinoise.com',
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    ...cityPages,
    ...stationPages,
    ...areaPages,
  ];
}
