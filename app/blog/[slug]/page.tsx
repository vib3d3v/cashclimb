export const dynamic = 'force-dynamic'
export const revalidate = 0

import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { createAdminClient } from '@/lib/supabase-server'
import { getAuthorByName } from '@/lib/authors'
import { getAutoAuthor } from '@/lib/seo-authors'
import type { Post } from '@/types'

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://cashclimb.org').replace(/\/$/, '')

function formatDate(date?: string) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

async function getPost(slug: string) {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle()

  return data as Post | null
}

async function getRelatedPosts(post: Post) {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('posts')
    .select('*')
    .eq('published', true)
    .eq('category', post.category)
    .neq('id', post.id)
    .order('created_at', { ascending: false })
    .limit(3)

  return (data ?? []) as Post[]
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const post = await getPost(params.slug)
  if (!post) return {}

  const url = `${siteUrl}/blog/${post.slug}`
  const image = post.cover_url || `${siteUrl}/opengraph-image`

  return {
    title: `${post.title} | CashClimb`,
    description: post.excerpt,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url,
      type: 'article',
      images: [{ url: image }],
      publishedTime: post.created_at,
      modifiedTime: post.updated_at,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [image],
    },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string }
}) {
  const post = await getPost(params.slug)
  if (!post) notFound()

  // ✅ FIXED AUTHOR LOGIC
  const fallbackAuthor = getAutoAuthor('cashclimb', post.category)

  const authorName =
    !post.author || post.author.toLowerCase().includes('editorial')
      ? fallbackAuthor.name
      : post.author

  const author = getAuthorByName(authorName)

  const relatedPosts = await getRelatedPosts(post)
  const articleUrl = `${siteUrl}/blog/${post.slug}`
  const image = post.cover_url || `${siteUrl}/opengraph-image`

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image,
    datePublished: post.created_at,
    dateModified: post.updated_at || post.created_at,
    author: {
      '@type': author.schemaType,
      name: author.name,
      url: `${siteUrl}/authors/${author.slug}`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'CashClimb',
    },
    mainEntityOfPage: articleUrl,
  }

  return (
    <>
      <Navbar />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <main className="max-w-6xl mx-auto px-6 py-12">
        <article>
          <h1>{post.title}</h1>

          <p>Author: {author.name}</p>

          <div dangerouslySetInnerHTML={{ __html: post.body }} />
        </article>
      </main>

      <Footer />
    </>
  )
}