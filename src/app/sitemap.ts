import { MetadataRoute } from 'next';

const legalPages = [
  'privacy-policy', 'terms', 'cookie-policy', 'refund-policy',
  'dpa', 'aup', 'data-deletion'
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://flowter.ai';

  const staticPages = [
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

  return staticPages.map(p => ({
    url: p.url,
    lastModified: new Date(),
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));
}
