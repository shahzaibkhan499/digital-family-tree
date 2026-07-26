import type { MetadataRoute } from 'next';
import { appConfig } from '@digital-family-tree/config';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = appConfig.url;

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];
}
