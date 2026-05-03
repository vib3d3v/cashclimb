import type { MetadataRoute } from 'next'

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://cashclimb.org').replace(/\/$/, '')

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/blog',
          '/blog/',
          '/about',
          '/authors',
          '/tools',
          '/tools/compound-calculator',
          '/tools/savings-calculator',
        ],
        disallow: [
          '/admin',
          '/admin/',
          '/api',
          '/api/',
          '/auth',
          '/auth/',
          '/_next/',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}