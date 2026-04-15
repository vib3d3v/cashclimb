import type { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase-server'
import { AUTHORS } from '@/lib/authors'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://cashclimb.org'
  const supabase = createAdminClient()

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/about`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/blog`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/editorial-standards`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/tools`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/tools/compound-calculator`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/tools/savings-calculator`, changeFrequency: 'weekly', priority: 0.8 },
  ]

  const authorPages: MetadataRoute.Sitemap = AUTHORS.map((author) => ({
    url: `${base}/authors/${author.slug}`,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  const { data: posts, error } = await supabase
    .from('posts')
    .select('slug, updated_at, published')
    .eq('published', true)
    .not('slug', 'is', null)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Sitemap posts query failed:', error)
  }

  const blogPages: MetadataRoute.Sitemap =
    posts?.map((post) => ({
      url: `${base}/blog/${post.slug}`,
      lastModified: post.updated_at ?? undefined,
      changeFrequency: 'weekly',
      priority: 0.7,
    })) ?? []

  return [...staticPages, ...authorPages, ...blogPages]
}