import type { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase-server'
import { AUTHORS } from '@/lib/authors'

type SitemapEntry = MetadataRoute.Sitemap[number]
type PostRow = {
  slug: string | null
  updated_at: string | null
  created_at: string | null
  published: boolean | null
}

function getBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://cashclimb.org').replace(/\/$/, '')
}

function getPostPriority(date?: string | null): number {
  if (!date) return 0.7

  const daysOld = (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)

  if (daysOld <= 2) return 0.9
  if (daysOld <= 7) return 0.85
  if (daysOld <= 30) return 0.75
  return 0.65
}

function getPostFrequency(date?: string | null): SitemapEntry['changeFrequency'] {
  if (!date) return 'monthly'

  const daysOld = (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)

  if (daysOld <= 7) return 'daily'
  if (daysOld <= 30) return 'weekly'
  return 'monthly'
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getBaseUrl()
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${base}/`,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${base}/about`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${base}/blog`,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${base}/editorial-standards`,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${base}/tools`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${base}/tools/compound-calculator`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${base}/tools/savings-calculator`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ]

  const authorPages: MetadataRoute.Sitemap = AUTHORS.map((author) => ({
    url: `${base}/authors/${author.slug}`,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  let posts: PostRow[] = []

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('posts')
        .select('slug, updated_at, created_at, published')
        .eq('published', true)
        .not('slug', 'is', null)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Sitemap posts query failed:', error)
      }

      posts = (data ?? []) as PostRow[]
    } catch (error) {
      console.error('Sitemap generation skipped dynamic posts:', error)
    }
  } else {
    console.warn('Sitemap generated without blog posts because Supabase env vars are missing.')
  }

  const blogPages: MetadataRoute.Sitemap = posts
    .filter((post) => post.slug)
    .map((post) => {
      const date = post.updated_at ?? post.created_at ?? null

      return {
        url: `${base}/blog/${post.slug}`,
        lastModified: date ? new Date(date) : undefined,
        changeFrequency: getPostFrequency(date),
        priority: getPostPriority(date),
      }
    })

  return [...staticPages, ...authorPages, ...blogPages]
}
