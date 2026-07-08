import { MetadataRoute } from "next"
import { getSiteUrl } from "@/lib/site"

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl()
  const now = new Date()

  const staticRoutes: { path: string; priority: string; changefreq: string }[] = [
    { path: "", priority: "1.0", changefreq: "weekly" },
    { path: "/features", priority: "0.9", changefreq: "monthly" },
    { path: "/pricing", priority: "0.9", changefreq: "monthly" },
    { path: "/faq", priority: "0.8", changefreq: "monthly" },
    { path: "/about", priority: "0.7", changefreq: "monthly" },
    { path: "/blog", priority: "0.7", changefreq: "weekly" },
    { path: "/case-studies", priority: "0.7", changefreq: "monthly" },
    { path: "/changelog", priority: "0.7", changefreq: "weekly" },
    { path: "/legal/privacy-policy", priority: "0.5", changefreq: "yearly" },
    { path: "/legal/terms", priority: "0.5", changefreq: "yearly" },
    { path: "/legal/cookie-policy", priority: "0.4", changefreq: "yearly" },
    { path: "/legal/refund-policy", priority: "0.4", changefreq: "yearly" },
    { path: "/legal/dpa", priority: "0.3", changefreq: "yearly" },
    { path: "/legal/aup", priority: "0.3", changefreq: "yearly" },
    { path: "/legal/data-deletion", priority: "0.3", changefreq: "yearly" },
  ]

  return staticRoutes.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified: now,
    changeFrequency: route.changefreq as MetadataRoute.Sitemap[number]["changeFrequency"],
    priority: parseFloat(route.priority),
  }))
}
