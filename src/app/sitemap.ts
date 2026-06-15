import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/site'

const siteUrl = getSiteUrl()

export default function sitemap(): MetadataRoute.Sitemap {
  const publicPages = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 1.0 },
    { url: `${siteUrl}/pricing`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.9 },
    { url: `${siteUrl}/faq`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${siteUrl}/changelog`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.7 },
    { url: `${siteUrl}/login`, lastModified: new Date(), changeFrequency: 'never' as const, priority: 0.3 },
    { url: `${siteUrl}/legal/privacy-policy`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.4 },
    { url: `${siteUrl}/legal/terms`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.4 },
    { url: `${siteUrl}/legal/cookie-policy`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: `${siteUrl}/legal/refund-policy`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: `${siteUrl}/legal/dpa`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.2 },
    { url: `${siteUrl}/legal/aup`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.2 },
    { url: `${siteUrl}/legal/data-deletion`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.2 },
  ]

  return publicPages
}
