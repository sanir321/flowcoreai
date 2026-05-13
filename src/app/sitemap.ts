import { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site';

const legalPages = [
  'privacy-policy', 'terms', 'cookie-policy', 'refund-policy',
  'dpa', 'aup', 'data-deletion'
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();

  const pages = [
    { url: baseUrl, priority: 1, changeFrequency: 'weekly' as const },
    { url: `${baseUrl}/login`, priority: 0.5, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/faq`, priority: 0.7, changeFrequency: 'weekly' as const },
    { url: `${baseUrl}/changelog`, priority: 0.4, changeFrequency: 'weekly' as const },
    ...legalPages.map(slug => ({
      url: `${baseUrl}/legal/${slug}`,
      priority: 0.3,
      changeFrequency: 'monthly' as const,
    })),
  ];

  return pages.map(p => ({
    url: p.url,
    lastModified: new Date(),
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));
}
